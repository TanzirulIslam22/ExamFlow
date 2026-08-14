import { useEffect, useState } from 'react';
import { Building2, Save, Check, UploadCloud } from 'lucide-react';
import client from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const instituteTypes = ['School', 'College', 'Coaching Center', 'Corporate'];

export default function Settings() {
  const { user, refreshMe } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ name: '', type: '', phone: '', city: '', logo: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '', type: user.type || 'Coaching Center',
        phone: user.phone || '', city: user.city || '', logo: user.logo || '',
      });
    }
  }, [user]);

  const handleLogo = (file) => {
    if (!file) return;
    if (file.size > 500 * 1024) return toast.error('Logo must be under 500 KB');
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, logo: reader.result }));
    reader.readAsDataURL(file);
  };

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await client.put('/institute/me', form);
      await refreshMe();
      toast.success('Settings saved');
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-ink">Settings</h2>
        <p className="text-sm text-gray">Manage your institute profile and branding</p>
      </div>

      <div className="card p-6 space-y-5">
        <div>
          <h3 className="font-semibold text-ink flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" /> Institute Profile</h3>
          <p className="text-xs text-gray mt-0.5">This information is shown on student pages and exports.</p>
        </div>

        <div>
          <label className="label">Institute Logo</label>
          <label className="flex items-center gap-4 border border-dashed rounded-control p-4 cursor-pointer hover:border-primary transition-colors">
            {form.logo ? (
              <img src={form.logo} alt="logo" className="h-14 w-14 rounded-lg object-cover" />
            ) : (
              <div className="h-14 w-14 rounded-lg bg-primary-50 flex items-center justify-center">
                <UploadCloud className="h-6 w-6 text-primary" />
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-ink">{form.logo ? 'Click to change logo' : 'Upload institute logo'}</p>
              <p className="text-xs text-gray">PNG or JPG, up to 500 KB</p>
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogo(e.target.files[0])} />
          </label>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Institute Name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Institute Type</label>
            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {instituteTypes.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="label">City</label>
            <input className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
        </div>

        <div className="border-t border-line pt-5">
          <label className="label">Admin Email</label>
          <input className="input !bg-gray-50" value={user?.email || ''} disabled />
          <p className="text-xs text-gray mt-1.5">Contact support to change the login email.</p>
        </div>

        <div className="flex items-center gap-3">
          <button className="btn-primary" onClick={save} disabled={saving}>
            {saved ? <><Check className="h-4 w-4" /> Saved</> : <><Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save Changes'}</>}
          </button>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-semibold text-ink">Plan</h3>
        <div className="flex items-center justify-between mt-3">
          <div>
            <p className="text-sm text-gray">You are currently on the</p>
            <p className="text-lg font-bold text-ink capitalize">{user?.plan || 'free'} plan</p>
          </div>
          <button className="btn-secondary" onClick={() => toast.info('Upgrades are coming soon')}>Upgrade</button>
        </div>
      </div>
    </div>
  );
}
