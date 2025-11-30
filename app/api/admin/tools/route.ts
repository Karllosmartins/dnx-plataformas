import { supabase } from '../../../../lib/supabase'
import { ApiResponse, handleApiError } from '../../../../lib/api-utils'

export const dynamic = 'force-dynamic'

// GET - Listar todas as tools
export async function GET() {
  try {
    const { data: tools, error } = await supabase
      .from('tools')
      .select('id, type, nome, descricao')
      .order('nome')

    if (error) throw error

    return ApiResponse.success(tools || [])
  } catch (error) {
    return handleApiError(error)
  }
}
