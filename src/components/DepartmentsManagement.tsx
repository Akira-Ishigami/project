import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Edit2, X, Loader2, Briefcase } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Department {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  created_at: string;
  is_reception?: boolean;
  is_default?: boolean;
}

export default function DepartmentsManagement() {
  const { company } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    fetchDepartments();
  }, [company?.id]);

  /* =========================================================
     Helpers
  ========================================================= */
  const isRecepcao = (dept?: Department | null) => {
    if (!dept) return false;
    return (
      dept.is_reception === true ||
      String(dept.name).toLowerCase().startsWith('recep')
    );
  };

  /* =========================================================
     Load
  ========================================================= */
  const fetchDepartments = async () => {
    if (!company?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDepartments(data || []);
    } catch (err) {
      console.error('Erro ao carregar departamentos:', err);
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     Submit
  ========================================================= */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company?.id) return;

    // 🔒 Bloqueio de segurança
    if (editingId) {
      const dept = departments.find(d => d.id === editingId);
      if (isRecepcao(dept)) {
        alert('❌ O departamento Recepção não pode ser editado.');
        return;
      }
    }

    setSaving(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from('departments')
          .update({
            name: formData.name,
            description: formData.description,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('departments')
          .insert({
            company_id: company.id,
            name: formData.name,
            description: formData.description,
          });

        if (error) throw error;
      }

      handleCancel();
      fetchDepartments();
    } catch (err) {
      console.error('Erro ao salvar departamento:', err);
      alert('Erro ao salvar departamento');
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     Actions
  ========================================================= */
  const handleEdit = (dept: Department) => {
    if (isRecepcao(dept)) return;

    setFormData({
      name: dept.name,
      description: dept.description || '',
    });
    setEditingId(dept.id);
    setShowForm(true);
  };

  const handleDelete = async (dept: Department) => {
    if (isRecepcao(dept)) {
      alert('❌ O departamento Recepção não pode ser removido.');
      return;
    }

    if (!confirm(`Deseja excluir o departamento "${dept.name}"?`)) return;

    try {
      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', dept.id);

      if (error) throw error;
      fetchDepartments();
    } catch (err) {
      console.error('Erro ao excluir departamento:', err);
      alert('Erro ao excluir departamento');
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', description: '' });
    setShowForm(false);
    setEditingId(null);
  };

  /* =========================================================
     UI
  ========================================================= */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Departamentos</h2>
          <p className="text-sm text-gray-500 mt-1">
            Gerencie os departamentos da sua empresa
          </p>
        </div>

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-xl hover:scale-105 transition-all shadow-md"
          >
            <Plus className="w-5 h-5" />
            Novo Departamento
          </button>
        )}
      </div>

      {/* FORM */}
      {showForm && (
        <div className="bg-white/70 border rounded-2xl p-6 mb-6 shadow-md">
          <div className="flex justify-between mb-4">
            <h3 className="font-semibold">
              {editingId ? 'Editar Departamento' : 'Novo Departamento'}
            </h3>
            <button onClick={handleCancel}>
              <X />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nome do departamento"
              className="w-full px-4 py-2 border rounded-xl"
            />

            <textarea
              value={formData.description}
              onChange={e =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Descrição"
              rows={3}
              className="w-full px-4 py-2 border rounded-xl"
            />

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-teal-600 text-white py-2 rounded-xl"
              >
                {saving ? 'Salvando...' : editingId ? 'Atualizar' : 'Criar'}
              </button>

              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-100 rounded-xl"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((dept) => {
          const recepcao = isRecepcao(dept);

          return (
            <div
              key={dept.id}
              className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-2xl p-6 shadow-md hover:shadow-lg transition-all group hover:-translate-y-1"
            >
              <div className="flex justify-between mb-3">
                <div className="w-14 h-14 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center shadow-md">
                  <Briefcase className="text-white w-6 h-6" />
                </div>

                {!recepcao && (
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(dept)} className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(dept)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <h3 className="font-bold text-gray-900">{dept.name}</h3>

              {dept.description && (
                <p className="text-sm text-gray-600 mt-1">
                  {dept.description}
                </p>
              )}

              <p className="text-xs text-gray-400 mt-4">
                Criado em{' '}
                {new Date(dept.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
