'use client'

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Plus, Edit, Trash2, Save, X, Users } from 'lucide-react';

interface CampoPersonalizado {
  nome: string;
  label: string;
  tipo: 'text' | 'number' | 'select' | 'multiselect' | 'boolean' | 'date' | 'textarea';
  opcoes?: string[];
  obrigatorio: boolean;
  ajuda?: string;
}

interface MetricasConfig {
  campos_receita: string[];
  campos_conversao: string[];
  metricas_principais: string[];
}

interface TipoNegocio {
  id: number;
  nome: string;
  nome_exibicao: string;
  descricao: string;
  icone: string;
  cor: string;
  campos_personalizados: CampoPersonalizado[];
  status_personalizados: string[];
  metricas_config: MetricasConfig;
  ativo: boolean;
  ordem: number;
  created_at: string;
  updated_at: string;
}

export default function TiposNegocioAdmin() {
  const [tipos, setTipos] = useState<TipoNegocio[]>([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState<number | null>(null);
  const [criandoNovo, setCriandoNovo] = useState(false);
  const [tipoEditando, setTipoEditando] = useState<Partial<TipoNegocio>>({});
  const [novoTipo, setNovoTipo] = useState<Partial<TipoNegocio>>({
    nome: '',
    nome_exibicao: '',
    descricao: '',
    icone: 'building',
    cor: '#3B82F6',
    campos_personalizados: [],
    status_personalizados: ['novo_lead', 'qualificacao', 'convertido'],
    metricas_config: {
      campos_receita: [],
      campos_conversao: [],
      metricas_principais: []
    },
    ativo: true,
    ordem: 1
  });

  const supabase = createClientComponentClient();

  useEffect(() => {
    carregarTipos();
  }, []);

  const carregarTipos = async () => {
    try {
      const { data, error } = await supabase
        .from('tipos_negocio')
        .select('*')
        .order('ordem', { ascending: true });

      if (error) throw error;
      
      // Converter campos JSON string para objetos
      const tiposProcessados = data?.map(tipo => ({
        ...tipo,
        campos_personalizados: typeof tipo.campos_personalizados === 'string'
          ? JSON.parse(tipo.campos_personalizados)
          : tipo.campos_personalizados,
        status_personalizados: typeof tipo.status_personalizados === 'string'
          ? JSON.parse(tipo.status_personalizados)
          : tipo.status_personalizados,
        metricas_config: typeof tipo.metricas_config === 'string'
          ? JSON.parse(tipo.metricas_config)
          : tipo.metricas_config || { campos_receita: [], campos_conversao: [], metricas_principais: [] }
      })) || [];
      
      setTipos(tiposProcessados);
    } catch (error) {
      console.error('Erro ao carregar tipos:', error);
    } finally {
      setLoading(false);
    }
  };

  const salvarTipo = async () => {
    try {
      if (!novoTipo.nome || !novoTipo.nome_exibicao) {
        alert('Nome e Nome de Exibição são obrigatórios');
        return;
      }

      const { data, error } = await supabase
        .from('tipos_negocio')
        .insert([novoTipo])
        .select()
        .single();

      if (error) throw error;

      setTipos([...tipos, data]);
      setCriandoNovo(false);
      setNovoTipo({
        nome: '',
        nome_exibicao: '',
        descricao: '',
        icone: 'building',
        cor: '#3B82F6',
        campos_personalizados: [],
        status_personalizados: ['novo_lead', 'qualificacao', 'convertido'],
        metricas_config: {
          campos_receita: [],
          campos_conversao: [],
          metricas_principais: []
        },
        ativo: true,
        ordem: tipos.length + 1
      });

      alert('Tipo de negócio criado com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar tipo:', error);
      alert('Erro ao salvar tipo de negócio');
    }
  };

  const iniciarEdicao = (tipo: TipoNegocio) => {
    setTipoEditando({ ...tipo });
    setEditando(tipo.id);
  };

  const cancelarEdicao = () => {
    setEditando(null);
    setTipoEditando({});
  };

  const salvarEdicao = async () => {
    try {
      if (!tipoEditando.nome || !tipoEditando.nome_exibicao) {
        alert('Nome e Nome de Exibição são obrigatórios');
        return;
      }

      const { error } = await supabase
        .from('tipos_negocio')
        .update({
          nome: tipoEditando.nome,
          nome_exibicao: tipoEditando.nome_exibicao,
          descricao: tipoEditando.descricao,
          icone: tipoEditando.icone,
          cor: tipoEditando.cor,
          campos_personalizados: tipoEditando.campos_personalizados,
          status_personalizados: tipoEditando.status_personalizados,
          metricas_config: tipoEditando.metricas_config,
          ativo: tipoEditando.ativo,
          ordem: tipoEditando.ordem
        })
        .eq('id', editando);

      if (error) throw error;

      setTipos(tipos.map(t =>
        t.id === editando ? { ...t, ...tipoEditando } as TipoNegocio : t
      ));

      cancelarEdicao();
      alert('Tipo de negócio atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar tipo:', error);
      alert('Erro ao atualizar tipo de negócio');
    }
  };

  const excluirTipo = async (id: number, nome: string) => {
    if (!confirm(`Tem certeza que deseja excluir o tipo "${nome}"?\n\nEsta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('tipos_negocio')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTipos(tipos.filter(t => t.id !== id));
      alert('Tipo de negócio excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir tipo:', error);
      alert('Erro ao excluir tipo de negócio. Verifique se não há leads associados a este tipo.');
    }
  };

  const alternarAtivo = async (id: number, ativo: boolean) => {
    try {
      const { error } = await supabase
        .from('tipos_negocio')
        .update({ ativo: !ativo })
        .eq('id', id);

      if (error) throw error;

      setTipos(tipos.map(t => t.id === id ? { ...t, ativo: !ativo } : t));
    } catch (error) {
      console.error('Erro ao alterar status:', error);
    }
  };

  const adicionarCampo = (isEdit = false) => {
    const novoCampo = {
      nome: '',
      label: '',
      tipo: 'text' as const,
      obrigatorio: false
    };

    if (isEdit) {
      setTipoEditando({
        ...tipoEditando,
        campos_personalizados: [
          ...(tipoEditando.campos_personalizados || []),
          novoCampo
        ]
      });
    } else {
      setNovoTipo({
        ...novoTipo,
        campos_personalizados: [
          ...(novoTipo.campos_personalizados || []),
          novoCampo
        ]
      });
    }
  };

  const removerCampo = (index: number, isEdit = false) => {
    if (isEdit) {
      const campos = [...(tipoEditando.campos_personalizados || [])];
      campos.splice(index, 1);
      setTipoEditando({ ...tipoEditando, campos_personalizados: campos });
    } else {
      const campos = [...(novoTipo.campos_personalizados || [])];
      campos.splice(index, 1);
      setNovoTipo({ ...novoTipo, campos_personalizados: campos });
    }
  };

  const atualizarCampo = (index: number, campo: CampoPersonalizado, isEdit = false) => {
    if (isEdit) {
      const campos = [...(tipoEditando.campos_personalizados || [])];
      campos[index] = campo;
      setTipoEditando({ ...tipoEditando, campos_personalizados: campos });
    } else {
      const campos = [...(novoTipo.campos_personalizados || [])];
      campos[index] = campo;
      setNovoTipo({ ...novoTipo, campos_personalizados: campos });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando tipos de negócio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tipos de Negócio</h1>
          <p className="text-gray-600 mt-2">
            Gerencie os tipos de negócio disponíveis no sistema
          </p>
        </div>
        <Button 
          onClick={() => setCriandoNovo(true)}
          className="flex items-center gap-2"
          disabled={criandoNovo}
        >
          <Plus size={20} />
          Novo Tipo
        </Button>
      </div>

      {/* Lista de Tipos Existentes */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 mb-8">
        {tipos.map((tipo) => (
          <Card key={tipo.id} className={`relative ${!tipo.ativo ? 'opacity-60' : ''}`}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: tipo.cor }}
                  />
                  <CardTitle className="text-base">{tipo.nome_exibicao}</CardTitle>
                </div>
                <Badge variant={tipo.ativo ? 'default' : 'secondary'}>
                  {tipo.ativo ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="space-y-2">
                <p className="text-xs text-gray-500">
                  ID: {tipo.nome}
                </p>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {tipo.descricao}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{tipo.campos_personalizados?.length || 0} campos</span>
                  <span>•</span>
                  <span>{tipo.status_personalizados?.length || 0} status</span>
                </div>

                {/* Botões de Ação */}
                <div className="flex gap-1 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs px-2 py-1 h-7"
                    onClick={() => alternarAtivo(tipo.id, tipo.ativo)}
                  >
                    {tipo.ativo ? 'Desativar' : 'Ativar'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="px-2 py-1 h-7"
                    onClick={() => iniciarEdicao(tipo)}
                    disabled={editando === tipo.id}
                  >
                    <Edit size={12} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => excluirTipo(tipo.id, tipo.nome_exibicao)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 h-7"
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Formulário de Novo Tipo */}
      {criandoNovo && (
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Criar Novo Tipo de Negócio</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCriandoNovo(false)}
              >
                <X size={20} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Informações Básicas */}
              <div className="space-y-3">
                <div>
                  <Label htmlFor="nome">ID do Tipo *</Label>
                  <Input
                    id="nome"
                    placeholder="ex: incorporadora"
                    value={novoTipo.nome}
                    onChange={(e) => setNovoTipo({ ...novoTipo, nome: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="nome_exibicao">Nome de Exibição *</Label>
                  <Input
                    id="nome_exibicao"
                    placeholder="ex: Incorporadora Imobiliária"
                    value={novoTipo.nome_exibicao}
                    onChange={(e) => setNovoTipo({ ...novoTipo, nome_exibicao: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    placeholder="Descrição do tipo de negócio..."
                    value={novoTipo.descricao}
                    onChange={(e) => setNovoTipo({ ...novoTipo, descricao: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="icone">Ícone</Label>
                  <select
                    id="icone"
                    className="w-full p-2 border rounded"
                    value={novoTipo.icone}
                    onChange={(e) => setNovoTipo({ ...novoTipo, icone: e.target.value })}
                  >
                    <option value="building">Building</option>
                    <option value="scale">Scale (Balança)</option>
                    <option value="building-office">Building Office</option>
                    <option value="home">Home</option>
                    <option value="users">Users</option>
                    <option value="briefcase">Briefcase</option>
                    <option value="heart">Heart</option>
                    <option value="car">Car</option>
                    <option value="plane">Plane</option>
                    <option value="ship">Ship</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="cor">Cor</Label>
                  <div className="flex gap-2">
                    <Input
                      id="cor"
                      type="color"
                      value={novoTipo.cor}
                      onChange={(e) => setNovoTipo({ ...novoTipo, cor: e.target.value })}
                      className="w-16"
                    />
                    <Input
                      value={novoTipo.cor}
                      onChange={(e) => setNovoTipo({ ...novoTipo, cor: e.target.value })}
                      placeholder="#3B82F6"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="ordem">Ordem de Exibição</Label>
                  <Input
                    id="ordem"
                    type="number"
                    min="1"
                    placeholder="1"
                    value={novoTipo.ordem}
                    onChange={(e) => setNovoTipo({ ...novoTipo, ordem: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>

              {/* Status do Funil */}
              <div className="space-y-3">
                <div>
                  <Label>Status do Funil</Label>
                  <Textarea
                    placeholder="Digite um status por linha"
                    value={novoTipo.status_personalizados?.join('\n') || ''}
                    onChange={(e) => setNovoTipo({
                      ...novoTipo,
                      status_personalizados: e.target.value.split('\n').filter(s => s.trim())
                    })}
                    rows={6}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Ex: novo_lead, qualificacao, convertido
                  </p>
                </div>

                {/* Configuração de Métricas */}
                <div>
                  <Label className="text-base mb-3 block">Configuração de Métricas</Label>

                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm">Campos de Receita</Label>
                      <Textarea
                        placeholder="Campos de receita (um por linha)"
                        value={novoTipo.metricas_config?.campos_receita?.join('\n') || ''}
                        onChange={(e) => setNovoTipo({
                          ...novoTipo,
                          metricas_config: {
                            ...novoTipo.metricas_config || { campos_receita: [], campos_conversao: [], metricas_principais: [] },
                            campos_receita: e.target.value.split('\n').filter(s => s.trim())
                          }
                        })}
                        rows={2}
                        className="text-sm"
                      />
                    </div>

                    <div>
                      <Label className="text-sm">Campos de Conversão</Label>
                      <Textarea
                        placeholder="Campos de conversão (um por linha)"
                        value={novoTipo.metricas_config?.campos_conversao?.join('\n') || ''}
                        onChange={(e) => setNovoTipo({
                          ...novoTipo,
                          metricas_config: {
                            ...novoTipo.metricas_config || { campos_receita: [], campos_conversao: [], metricas_principais: [] },
                            campos_conversao: e.target.value.split('\n').filter(s => s.trim())
                          }
                        })}
                        rows={2}
                        className="text-sm"
                      />
                    </div>

                    <div>
                      <Label className="text-sm">Métricas Principais</Label>
                      <Textarea
                        placeholder="Métricas principais (uma por linha)"
                        value={novoTipo.metricas_config?.metricas_principais?.join('\n') || ''}
                        onChange={(e) => setNovoTipo({
                          ...novoTipo,
                          metricas_config: {
                            ...novoTipo.metricas_config || { campos_receita: [], campos_conversao: [], metricas_principais: [] },
                            metricas_principais: e.target.value.split('\n').filter(s => s.trim())
                          }
                        })}
                        rows={2}
                        className="text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Campos Personalizados */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-lg">Campos Personalizados</Label>
                <Button type="button" variant="outline" onClick={() => adicionarCampo()}>
                  <Plus size={16} className="mr-2" />
                  Adicionar Campo
                </Button>
              </div>

              <div className="space-y-3">
                {novoTipo.campos_personalizados?.map((campo, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid gap-4 md:grid-cols-4">
                      <div>
                        <Label>Nome do Campo</Label>
                        <Input
                          placeholder="ex: tipo_imovel"
                          value={campo.nome}
                          onChange={(e) => atualizarCampo(index, { ...campo, nome: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Label</Label>
                        <Input
                          placeholder="ex: Tipo do Imóvel"
                          value={campo.label}
                          onChange={(e) => atualizarCampo(index, { ...campo, label: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Tipo</Label>
                        <select
                          className="w-full p-2 border rounded"
                          value={campo.tipo}
                          onChange={(e) => atualizarCampo(index, { 
                            ...campo, 
                            tipo: e.target.value as CampoPersonalizado['tipo'] 
                          })}
                        >
                          <option value="text">Texto</option>
                          <option value="number">Número</option>
                          <option value="select">Select</option>
                          <option value="multiselect">Multi-Select</option>
                          <option value="boolean">Sim/Não</option>
                          <option value="date">Data</option>
                          <option value="textarea">Texto Longo</option>
                        </select>
                      </div>
                      <div className="flex items-end gap-2">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={campo.obrigatorio}
                            onChange={(e) => atualizarCampo(index, { 
                              ...campo, 
                              obrigatorio: e.target.checked 
                            })}
                          />
                          Obrigatório
                        </label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removerCampo(index)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                    
                    {(campo.tipo === 'select' || campo.tipo === 'multiselect') && (
                      <div className="mt-4">
                        <Label>Opções (uma por linha)</Label>
                        <Textarea
                          placeholder="opcao1&#10;opcao2&#10;opcao3"
                          value={campo.opcoes?.join('\n') || ''}
                          onChange={(e) => atualizarCampo(index, {
                            ...campo,
                            opcoes: e.target.value.split('\n').filter(o => o.trim())
                          })}
                          rows={3}
                        />
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex justify-end gap-4 mt-8">
              <Button
                variant="outline"
                onClick={() => setCriandoNovo(false)}
              >
                Cancelar
              </Button>
              <Button onClick={salvarTipo}>
                <Save size={16} className="mr-2" />
                Salvar Tipo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulário de Edição */}
      {editando && (
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Editar Tipo de Negócio</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={cancelarEdicao}
              >
                <X size={20} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Informações Básicas */}
              <div className="space-y-3">
                <div>
                  <Label htmlFor="edit-nome">ID do Tipo *</Label>
                  <Input
                    id="edit-nome"
                    placeholder="ex: incorporadora"
                    value={tipoEditando.nome || ''}
                    onChange={(e) => setTipoEditando({ ...tipoEditando, nome: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="edit-nome_exibicao">Nome de Exibição *</Label>
                  <Input
                    id="edit-nome_exibicao"
                    placeholder="ex: Incorporadora Imobiliária"
                    value={tipoEditando.nome_exibicao || ''}
                    onChange={(e) => setTipoEditando({ ...tipoEditando, nome_exibicao: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="edit-descricao">Descrição</Label>
                  <Textarea
                    id="edit-descricao"
                    placeholder="Descrição do tipo de negócio..."
                    value={tipoEditando.descricao || ''}
                    onChange={(e) => setTipoEditando({ ...tipoEditando, descricao: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="edit-icone">Ícone</Label>
                  <select
                    id="edit-icone"
                    className="w-full p-2 border rounded"
                    value={tipoEditando.icone || 'building'}
                    onChange={(e) => setTipoEditando({ ...tipoEditando, icone: e.target.value })}
                  >
                    <option value="building">Building</option>
                    <option value="scale">Scale (Balança)</option>
                    <option value="building-office">Building Office</option>
                    <option value="home">Home</option>
                    <option value="users">Users</option>
                    <option value="briefcase">Briefcase</option>
                    <option value="heart">Heart</option>
                    <option value="car">Car</option>
                    <option value="plane">Plane</option>
                    <option value="ship">Ship</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="edit-cor">Cor</Label>
                  <div className="flex gap-2">
                    <Input
                      id="edit-cor"
                      type="color"
                      value={tipoEditando.cor || '#3B82F6'}
                      onChange={(e) => setTipoEditando({ ...tipoEditando, cor: e.target.value })}
                      className="w-16"
                    />
                    <Input
                      value={tipoEditando.cor || '#3B82F6'}
                      onChange={(e) => setTipoEditando({ ...tipoEditando, cor: e.target.value })}
                      placeholder="#3B82F6"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-ordem">Ordem de Exibição</Label>
                  <Input
                    id="edit-ordem"
                    type="number"
                    min="1"
                    placeholder="1"
                    value={tipoEditando.ordem || 1}
                    onChange={(e) => setTipoEditando({ ...tipoEditando, ordem: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>

              {/* Status do Funil */}
              <div className="space-y-3">
                <div>
                  <Label>Status do Funil</Label>
                  <Textarea
                    placeholder="Digite um status por linha"
                    value={tipoEditando.status_personalizados?.join('\n') || ''}
                    onChange={(e) => setTipoEditando({
                      ...tipoEditando,
                      status_personalizados: e.target.value.split('\n').filter(s => s.trim())
                    })}
                    rows={6}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Ex: novo_lead, qualificacao, convertido
                  </p>
                </div>

                {/* Configuração de Métricas */}
                <div>
                  <Label className="text-base mb-3 block">Configuração de Métricas</Label>

                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm">Campos de Receita</Label>
                      <Textarea
                        placeholder="Campos de receita (um por linha)"
                        value={tipoEditando.metricas_config?.campos_receita?.join('\n') || ''}
                        onChange={(e) => setTipoEditando({
                          ...tipoEditando,
                          metricas_config: {
                            ...tipoEditando.metricas_config || { campos_receita: [], campos_conversao: [], metricas_principais: [] },
                            campos_receita: e.target.value.split('\n').filter(s => s.trim())
                          }
                        })}
                        rows={2}
                        className="text-sm"
                      />
                    </div>

                    <div>
                      <Label className="text-sm">Campos de Conversão</Label>
                      <Textarea
                        placeholder="Campos de conversão (um por linha)"
                        value={tipoEditando.metricas_config?.campos_conversao?.join('\n') || ''}
                        onChange={(e) => setTipoEditando({
                          ...tipoEditando,
                          metricas_config: {
                            ...tipoEditando.metricas_config || { campos_receita: [], campos_conversao: [], metricas_principais: [] },
                            campos_conversao: e.target.value.split('\n').filter(s => s.trim())
                          }
                        })}
                        rows={2}
                        className="text-sm"
                      />
                    </div>

                    <div>
                      <Label className="text-sm">Métricas Principais</Label>
                      <Textarea
                        placeholder="Métricas principais (uma por linha)"
                        value={tipoEditando.metricas_config?.metricas_principais?.join('\n') || ''}
                        onChange={(e) => setTipoEditando({
                          ...tipoEditando,
                          metricas_config: {
                            ...tipoEditando.metricas_config || { campos_receita: [], campos_conversao: [], metricas_principais: [] },
                            metricas_principais: e.target.value.split('\n').filter(s => s.trim())
                          }
                        })}
                        rows={2}
                        className="text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Campos Personalizados */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-lg">Campos Personalizados</Label>
                <Button type="button" variant="outline" onClick={() => adicionarCampo(true)}>
                  <Plus size={16} className="mr-2" />
                  Adicionar Campo
                </Button>
              </div>

              <div className="space-y-3">
                {tipoEditando.campos_personalizados?.map((campo, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid gap-4 md:grid-cols-4">
                      <div>
                        <Label>Nome do Campo</Label>
                        <Input
                          placeholder="ex: tipo_imovel"
                          value={campo.nome}
                          onChange={(e) => atualizarCampo(index, { ...campo, nome: e.target.value }, true)}
                        />
                      </div>
                      <div>
                        <Label>Label</Label>
                        <Input
                          placeholder="ex: Tipo do Imóvel"
                          value={campo.label}
                          onChange={(e) => atualizarCampo(index, { ...campo, label: e.target.value }, true)}
                        />
                      </div>
                      <div>
                        <Label>Tipo</Label>
                        <select
                          className="w-full p-2 border rounded"
                          value={campo.tipo}
                          onChange={(e) => atualizarCampo(index, {
                            ...campo,
                            tipo: e.target.value as CampoPersonalizado['tipo']
                          }, true)}
                        >
                          <option value="text">Texto</option>
                          <option value="number">Número</option>
                          <option value="select">Select</option>
                          <option value="multiselect">Multi-Select</option>
                          <option value="boolean">Sim/Não</option>
                          <option value="date">Data</option>
                          <option value="textarea">Texto Longo</option>
                        </select>
                      </div>
                      <div className="flex items-end gap-2">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={campo.obrigatorio}
                            onChange={(e) => atualizarCampo(index, {
                              ...campo,
                              obrigatorio: e.target.checked
                            }, true)}
                          />
                          Obrigatório
                        </label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removerCampo(index, true)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>

                    {(campo.tipo === 'select' || campo.tipo === 'multiselect') && (
                      <div className="mt-4">
                        <Label>Opções (uma por linha)</Label>
                        <Textarea
                          placeholder="opcao1&#10;opcao2&#10;opcao3"
                          value={campo.opcoes?.join('\n') || ''}
                          onChange={(e) => atualizarCampo(index, {
                            ...campo,
                            opcoes: e.target.value.split('\n').filter(o => o.trim())
                          }, true)}
                          rows={3}
                        />
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex justify-end gap-4 mt-8">
              <Button
                variant="outline"
                onClick={cancelarEdicao}
              >
                Cancelar
              </Button>
              <Button onClick={salvarEdicao}>
                <Save size={16} className="mr-2" />
                Salvar Alterações
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estatísticas */}
      <Card>
        <CardHeader>
          <CardTitle>Estatísticas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{tipos.length}</div>
              <div className="text-sm text-gray-600">Total de Tipos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {tipos.filter(t => t.ativo).length}
              </div>
              <div className="text-sm text-gray-600">Ativos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {tipos.reduce((acc, t) => acc + (t.campos_personalizados?.length || 0), 0)}
              </div>
              <div className="text-sm text-gray-600">Campos Configurados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {tipos.reduce((acc, t) => acc + (t.status_personalizados?.length || 0), 0)}
              </div>
              <div className="text-sm text-gray-600">Status Configurados</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}