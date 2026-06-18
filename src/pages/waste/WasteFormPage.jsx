import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getLabs } from '../../api/lab';
import { createWaste, getWaste, getWasteTypes, updateWaste } from '../../api/waste';
import { useAuth } from '../../context/AuthContext';

const STATUS_OPTIONS = ['REGISTERED', 'STORED', 'DISPOSAL_REQUESTED', 'DISPOSED'];

export default function WasteFormPage() {
  const { wasteId } = useParams();
  const isEdit = Boolean(wasteId);
  const { token } = useAuth();
  const navigate = useNavigate();

  const [types, setTypes] = useState([]);
  const [labs, setLabs] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    wasteName: '',
    wasteTypeCode: '',
    generatedLabId: '',
    storageLocation: '',
    status: 'REGISTERED',
  });

  useEffect(() => {
    Promise.all([getWasteTypes(token), getLabs(token)])
      .then(([typeList, labList]) => {
        setTypes(typeList);
        setLabs(labList);
      })
      .catch((err) => setError(err.message));
  }, [token]);

  useEffect(() => {
    if (!isEdit) return;
    getWaste(token, wasteId)
      .then((w) => setForm({
        wasteName: w.wasteName,
        wasteTypeCode: w.wasteTypeCode,
        generatedLabId: String(w.generatedLabId),
        storageLocation: w.storageLocation,
        status: w.status,
      }))
      .catch((err) => setError(err.message));
  }, [token, wasteId, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const body = {
      wasteName: form.wasteName,
      wasteTypeCode: form.wasteTypeCode,
      generatedLabId: Number(form.generatedLabId),
      storageLocation: form.storageLocation,
      ...(isEdit ? { status: form.status } : {}),
    };
    try {
      if (isEdit) {
        const updated = await updateWaste(token, wasteId, body);
        navigate(`/wastes/${updated.id}`);
      } else {
        const created = await createWaste(token, body);
        navigate(`/wastes/${created.id}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <h2>{isEdit ? '폐기물 수정' : '폐기물 등록'}</h2>
      {error && <p className="error-text">{error}</p>}
      <form className="card form-card" onSubmit={handleSubmit}>
        <label>폐기물명
          <input required value={form.wasteName} onChange={(e) => setForm({ ...form, wasteName: e.target.value })} />
        </label>
        <label>폐기물 종류
          <select required value={form.wasteTypeCode} onChange={(e) => setForm({ ...form, wasteTypeCode: e.target.value })}>
            <option value="">선택</option>
            {types.map((t) => <option key={t.code} value={t.code}>{t.name}</option>)}
          </select>
        </label>
        <label>발생 연구실
          <select required value={form.generatedLabId} onChange={(e) => setForm({ ...form, generatedLabId: e.target.value })}>
            <option value="">선택</option>
            {labs.map((l) => <option key={l.labId} value={l.labId}>{l.labName} ({l.buildingLocation})</option>)}
          </select>
        </label>
        <label>보관 위치
          <input required value={form.storageLocation} onChange={(e) => setForm({ ...form, storageLocation: e.target.value })} />
        </label>
        {isEdit && (
          <label>상태
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
        )}
        <div className="button-row">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {isEdit ? '저장' : '등록'}
          </button>
          <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>취소</button>
        </div>
      </form>
    </div>
  );
}
