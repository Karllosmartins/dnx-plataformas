'use client'

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Save, User, Phone, Building } from 'lucide-react';

interface CampoPersonalizado {
  nome: string;
  label: string;
  tipo: 'text' | 'number' | 'select' | 'multiselect' | 'boolean' | 'date' | 'textarea';
  opcoes?: string[];
  obrigatorio: boolean;
  ajuda?: string;
}

interface TipoNegocio {
  id: number;
  nome: string;
  nome_exibicao: string;
  cor: string;
  campos_personalizados: CampoPersonalizado[];
  status_personalizados: string[];
}

interface Lead {
  id?: number;
  nome_cliente: string;
  telefone: string;
  email_usuario?: string;
  nome_empresa?: string;
  tipo_negocio_id?: number;
  dados_personalizados: Record<string, any>;
  status_generico?: string;
  observacoes?: string;
}

interface LeadFormProps {
  leadId?: number;
  onSuccess?: (lead: Lead) => void;
  onCancel?: () => void;
  initialData?: Partial<Lead>;
  userId?: number; // ID do usuário logado
}

export default function LeadForm({ leadId, onSuccess, onCancel, initialData, userId }: LeadFormProps) {
  const [tipos, setTipos] = useState<TipoNegocio[]>([]);
  const [tipoSelecionado, setTipoSelecionado] = useState<TipoNegocio | null>(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [tipoUnico, setTipoUnico] = useState(false); // Se usuário tem apenas 1 tipo
  
  const [formData, setFormData] = useState<Lead>({
    nome_cliente: '',
    telefone: '',
    email_usuario: '',
    nome_empresa: '',
    dados_personalizados: {},
    ...initialData
  });

  const supabase = createClientComponentClient();

  useEffect(() => {
    carregarTipos();
  }, []);

  useEffect(() => {
    if (leadId) {
      carregarLead();
    }
  }, [leadId]);

  const carregarTipos = async () => {
    try {
      // Se temos userId, buscar apenas os tipos atribuídos ao usuário
      if (userId) {
        const { data, error } = await supabase
          .from('user_tipos_negocio')
          .select(`
            tipos_negocio (
              id, nome, nome_exibicao, cor,
              campos_personalizados, status_personalizados
            )
          `)
          .eq('user_id', userId)
          .eq('ativo', true);

        if (error) throw error;
        
        const tiposUsuario = data?.map(item => item.tipos_negocio).filter(Boolean) || [];
        setTipos(tiposUsuario);

        // Se usuário tem apenas 1 tipo, selecionar automaticamente
        if (tiposUsuario.length === 1) {
          setTipoUnico(true);
          setTipoSelecionado(tiposUsuario[0]);
          setFormData(prev => ({
            ...prev,
            tipo_negocio_id: tiposUsuario[0].id,
            status_generico: tiposUsuario[0].status_personalizados?.[0] || ''
          }));
        }
      } else {
        // Fallback: buscar todos os tipos ativos (para admin ou casos sem userId)
        const { data, error } = await supabase
          .from('tipos_negocio')
          .select('*')
          .eq('ativo', true)
          .order('ordem');

        if (error) throw error;
        setTipos(data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar tipos:', error);
    } finally {
      setLoading(false);
    }
  };

  const carregarLead = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select(`
          *,
          tipos_negocio (
            id, nome, nome_exibicao, cor, 
            campos_personalizados, status_personalizados
          )
        `)
        .eq('id', leadId)
        .single();

      if (error) throw error;
      
      setFormData({
        ...data,
        dados_personalizados: data.dados_personalizados || {}
      });
      
      if (data.tipos_negocio) {
        setTipoSelecionado(data.tipos_negocio);
      }
    } catch (error) {
      console.error('Erro ao carregar lead:', error);
    }
  };

  const handleTipoChange = (tipoId: string) => {
    const tipo = tipos.find(t => t.id === parseInt(tipoId));
    setTipoSelecionado(tipo || null);
    setFormData({
      ...formData,
      tipo_negocio_id: parseInt(tipoId),
      dados_personalizados: {}, // Reset campos personalizados
      status_generico: tipo?.status_personalizados?.[0] || ''
    });
  };

  const handleCampoPersonalizadoChange = (nomeCampo: string, valor: any) => {
    setFormData({
      ...formData,
      dados_personalizados: {
        ...formData.dados_personalizados,
        [nomeCampo]: valor
      }
    });
  };

  const renderCampoPersonalizado = (campo: CampoPersonalizado) => {
    const valor = formData.dados_personalizados[campo.nome] || '';

    switch (campo.tipo) {
      case 'text':
        return (
          <Input
            value={valor}
            onChange={(e) => handleCampoPersonalizadoChange(campo.nome, e.target.value)}
            placeholder={campo.ajuda}
            required={campo.obrigatorio}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={valor}
            onChange={(e) => handleCampoPersonalizadoChange(campo.nome, parseFloat(e.target.value) || 0)}
            placeholder={campo.ajuda}
            required={campo.obrigatorio}
          />
        );

      case 'select':
        return (
          <select
            className="w-full p-2 border rounded-md"
            value={valor}
            onChange={(e) => handleCampoPersonalizadoChange(campo.nome, e.target.value)}
            required={campo.obrigatorio}
          >
            <option value="">Selecione...</option>
            {campo.opcoes?.map(opcao => (
              <option key={opcao} value={opcao}>
                {opcao.charAt(0).toUpperCase() + opcao.slice(1).replace('_', ' ')}
              </option>
            ))}
          </select>
        );

      case 'multiselect':
        return (
          <div className="space-y-2">
            {campo.opcoes?.map(opcao => (
              <label key={opcao} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={(valor || []).includes(opcao)}
                  onChange={(e) => {
                    const valorAtual = valor || [];
                    const novoValor = e.target.checked
                      ? [...valorAtual, opcao]
                      : valorAtual.filter((v: string) => v !== opcao);
                    handleCampoPersonalizadoChange(campo.nome, novoValor);
                  }}
                />
                <span className="text-sm">
                  {opcao.charAt(0).toUpperCase() + opcao.slice(1).replace('_', ' ')}
                </span>
              </label>
            ))}
          </div>
        );

      case 'boolean':
        return (
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name={campo.nome}
                checked={valor === true}
                onChange={() => handleCampoPersonalizadoChange(campo.nome, true)}
              />
              Sim
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name={campo.nome}
                checked={valor === false}
                onChange={() => handleCampoPersonalizadoChange(campo.nome, false)}
              />
              Não
            </label>
          </div>
        );

      case 'date':
        return (
          <Input
            type="date"
            value={valor}
            onChange={(e) => handleCampoPersonalizadoChange(campo.nome, e.target.value)}
            required={campo.obrigatorio}
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={valor}
            onChange={(e) => handleCampoPersonalizadoChange(campo.nome, e.target.value)}
            placeholder={campo.ajuda}
            required={campo.obrigatorio}
            rows={3}
          />
        );

      default:
        return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);

    try {
      // Validar campos obrigatórios
      if (!formData.nome_cliente || !formData.telefone) {
        alert('Nome e telefone são obrigatórios');
        return;
      }

      if (!formData.tipo_negocio_id) {
        alert('Selecione um tipo de negócio');
        return;
      }

      // Validar campos personalizados obrigatórios
      const camposObrigatorios = tipoSelecionado?.campos_personalizados?.filter(c => c.obrigatorio) || [];
      for (const campo of camposObrigatorios) {
        if (!formData.dados_personalizados[campo.nome]) {
          alert(`O campo "${campo.label}" é obrigatório`);
          return;
        }
      }

      const dadosParaSalvar = {
        ...formData,
        user_id: userId || 1, // Usar userId do props ou fallback
        updated_at: new Date().toISOString()
      };

      let resultado;
      if (leadId) {
        // Atualizar lead existente
        const { data, error } = await supabase
          .from('leads')
          .update(dadosParaSalvar)
          .eq('id', leadId)
          .select()
          .single();
        
        if (error) throw error;
        resultado = data;
      } else {
        // Criar novo lead
        const { data, error } = await supabase
          .from('leads')
          .insert([dadosParaSalvar])
          .select()
          .single();
        
        if (error) throw error;
        resultado = data;
      }

      alert(leadId ? 'Lead atualizado com sucesso!' : 'Lead criado com sucesso!');
      
      if (onSuccess) {
        onSuccess(resultado);
      }

      // Reset form se for novo lead
      if (!leadId) {
        setFormData({
          nome_cliente: '',
          telefone: '',
          email_usuario: '',
          nome_empresa: '',
          dados_personalizados: {},
          tipo_negocio_id: formData.tipo_negocio_id,
          status_generico: tipoSelecionado?.status_personalizados?.[0] || ''
        });
      }

    } catch (error) {
      console.error('Erro ao salvar lead:', error);
      alert('Erro ao salvar lead. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User size={24} />
          {leadId ? 'Editar Lead' : 'Novo Lead'}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="nome_cliente">Nome do Cliente *</Label>
                  <Input
                    id="nome_cliente"
                    value={formData.nome_cliente}
                    onChange={(e) => setFormData({...formData, nome_cliente: e.target.value})}
                    required
                    placeholder="Nome completo do cliente"
                  />
                </div>
                
                <div>
                  <Label htmlFor="telefone">Telefone *</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                    required
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div>
                  <Label htmlFor="email_usuario">E-mail</Label>
                  <Input
                    id="email_usuario"
                    type="email"
                    value={formData.email_usuario || ''}
                    onChange={(e) => setFormData({...formData, email_usuario: e.target.value})}
                    placeholder="email@exemplo.com"
                  />
                </div>

                <div>
                  <Label htmlFor="nome_empresa">Empresa</Label>
                  <Input
                    id="nome_empresa"
                    value={formData.nome_empresa || ''}
                    onChange={(e) => setFormData({...formData, nome_empresa: e.target.value})}
                    placeholder="Nome da empresa (se aplicável)"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tipo de Negócio - Só mostra se usuário tem múltiplos tipos */}
          {!tipoUnico && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tipo de Negócio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>Selecione o Tipo *</Label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={formData.tipo_negocio_id || ''}
                      onChange={(e) => handleTipoChange(e.target.value)}
                      required
                    >
                      <option value="">Selecione o tipo de negócio...</option>
                      {tipos.map(tipo => (
                        <option key={tipo.id} value={tipo.id}>
                          {tipo.nome_exibicao}
                        </option>
                      ))}
                    </select>
                  </div>

                  {tipoSelecionado && (
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: tipoSelecionado.cor }}
                      />
                      <Badge style={{ backgroundColor: tipoSelecionado.cor }}>
                        {tipoSelecionado.nome_exibicao}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Indicador do Tipo (quando automático) */}
          {tipoUnico && tipoSelecionado && (
            <Card className="border-l-4" style={{ borderLeftColor: tipoSelecionado.cor }}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-6 h-6 rounded-full" 
                    style={{ backgroundColor: tipoSelecionado.cor }}
                  />
                  <div>
                    <h3 className="font-semibold">{tipoSelecionado.nome_exibicao}</h3>
                    <p className="text-sm text-gray-600">
                      Tipo atribuído automaticamente para sua conta
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Campos Personalizados */}
          {tipoSelecionado && tipoSelecionado.campos_personalizados?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Informações Específicas - {tipoSelecionado.nome_exibicao}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {tipoSelecionado.campos_personalizados.map((campo, index) => (
                    <div key={index} className={campo.tipo === 'textarea' ? 'md:col-span-2' : ''}>
                      <Label htmlFor={campo.nome}>
                        {campo.label}
                        {campo.obrigatorio && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      {renderCampoPersonalizado(campo)}
                      {campo.ajuda && (
                        <p className="text-xs text-gray-500 mt-1">{campo.ajuda}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status */}
          {tipoSelecionado && tipoSelecionado.status_personalizados?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label>Status Atual</Label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={formData.status_generico || ''}
                    onChange={(e) => setFormData({...formData, status_generico: e.target.value})}
                  >
                    {tipoSelecionado.status_personalizados.map(status => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botões de Ação */}
          <div className="flex justify-end gap-4 pt-6">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            )}
            <Button type="submit" disabled={salvando}>
              <Save size={16} className="mr-2" />
              {salvando ? 'Salvando...' : (leadId ? 'Atualizar' : 'Salvar Lead')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}