import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerChemical } from '../../api/chemical';
import { getLabs } from '../../api/lab';
import { useAuth } from '../../context/AuthContext';

const UNIT_PRESETS = [
  { name: '밀리리터', symbol: 'mL' },
  { name: '리터', symbol: 'L' },
  { name: '그램', symbol: 'g' },
  { name: '킬로그램', symbol: 'kg' },
  { name: '밀리그램', symbol: 'mg' },
];

const EMPTY_FORM = {
  labId: '',
  casNumber: '',
  catNumber: '',
  name: '',
  manufacturer: '',
  amount: 0,
  capacityUnit: { name: '밀리리터', symbol: 'mL' },
  hazardInfo: { signalWord: 'WARNING', hazardStatement: '', precautionaryStatement: '', pictogram: '' },
  chemicalProperty: { appearance: '', odor: '', ph: '', meltingPoint: '', boilingPoint: '', flashPoint: '', ignitionPoint: '' },
};

export default function ChemicalRegisterPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [labs, setLabs] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getLabs(token)
      .then(setLabs)
      .catch((err) => setError(err.message));
  }, [token]);

  const setField = (path, value) => {
    setForm((prev) => {
      const next = { ...prev };
      const keys = path.split('.');
      let cur = next;
      for (let i = 0; i < keys.length - 1; i++) {
        cur[keys[i]] = { ...cur[keys[i]] };
        cur = cur[keys[i]];
      }
      cur[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const handleUnitPreset = (e) => {
    const preset = UNIT_PRESETS.find((u) => u.symbol === e.target.value);
    if (preset) setField('capacityUnit', { name: preset.name, symbol: preset.symbol });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const cp = form.chemicalProperty;
    const body = {
      labId: Number(form.labId),
      casNumber: form.casNumber,
      catNumber: form.catNumber,
      name: form.name,
      manufacturer: form.manufacturer || undefined,
      amount: Number(form.amount),
      capacityUnit: form.capacityUnit,
      hazardInfo: {
        signalWord: form.hazardInfo.signalWord,
        hazardStatement: form.hazardInfo.hazardStatement || undefined,
        precautionaryStatement: form.hazardInfo.precautionaryStatement || undefined,
        pictogram: form.hazardInfo.pictogram || undefined,
      },
      chemicalProperty: {
        appearance: cp.appearance || undefined,
        odor: cp.odor || undefined,
        ph: cp.ph !== '' ? Number(cp.ph) : undefined,
        meltingPoint: cp.meltingPoint !== '' ? Number(cp.meltingPoint) : undefined,
        boilingPoint: cp.boilingPoint !== '' ? Number(cp.boilingPoint) : undefined,
        flashPoint: cp.flashPoint !== '' ? Number(cp.flashPoint) : undefined,
        ignitionPoint: cp.ignitionPoint !== '' ? Number(cp.ignitionPoint) : undefined,
      },
    };

    try {
      const created = await registerChemical(token, body);
      navigate(`/chemicals/${created.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <h2>화학물질 등록</h2>
      {error && <p className="error-text">{error}</p>}

      <form onSubmit={handleSubmit} className="chemical-form">

        {/* 기본 정보 */}
        <section className="card form-card">
          <h3>기본 정보</h3>
          <label>연구실
            <select value={form.labId} onChange={(e) => setField('labId', e.target.value)} required>
              <option value="">선택</option>
              {labs.map((l) => (
                <option key={l.labId} value={l.labId}>{l.labName}</option>
              ))}
            </select>
          </label>
          <label>물질명
            <input value={form.name} onChange={(e) => setField('name', e.target.value)} required />
          </label>
          <label>CAS 번호
            <input value={form.casNumber} onChange={(e) => setField('casNumber', e.target.value)} required placeholder="예: 64-17-5" />
          </label>
          <label>CAT 번호
            <input value={form.catNumber} onChange={(e) => setField('catNumber', e.target.value)} required placeholder="예: 100-0000" />
          </label>
          <label>제조사 (선택)
            <input value={form.manufacturer} onChange={(e) => setField('manufacturer', e.target.value)} />
          </label>
          <div className="chemical-amount-row">
            <label style={{ flex: 1 }}>보유량
              <input
                type="number"
                min={0}
                step="any"
                value={form.amount}
                onChange={(e) => setField('amount', e.target.value)}
                required
              />
            </label>
            <label style={{ flex: 1 }}>단위 선택
              <select value={form.capacityUnit.symbol} onChange={handleUnitPreset}>
                {UNIT_PRESETS.map((u) => (
                  <option key={u.symbol} value={u.symbol}>{u.name} ({u.symbol})</option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {/* 위험·경고 */}
        <section className="card form-card">
          <h3>위험·경고 정보</h3>
          <label>경고 등급
            <select
              value={form.hazardInfo.signalWord}
              onChange={(e) => setField('hazardInfo.signalWord', e.target.value)}
              required
            >
              <option value="WARNING">경고 (Warning)</option>
              <option value="DANGER">위험 (Danger)</option>
            </select>
          </label>
          <label>유해위험문구 H (선택)
            <textarea
              value={form.hazardInfo.hazardStatement}
              onChange={(e) => setField('hazardInfo.hazardStatement', e.target.value)}
              rows={2}
              placeholder="예: H225 인화성 액체 및 증기"
            />
          </label>
          <label>예방조치문구 P (선택)
            <textarea
              value={form.hazardInfo.precautionaryStatement}
              onChange={(e) => setField('hazardInfo.precautionaryStatement', e.target.value)}
              rows={2}
              placeholder="예: P210 열·불꽃·화기로부터 멀리하시오."
            />
          </label>
          <label>그림문자 (선택)
            <input
              value={form.hazardInfo.pictogram}
              onChange={(e) => setField('hazardInfo.pictogram', e.target.value)}
              placeholder="예: GHS02, GHS07"
            />
          </label>
        </section>

        {/* 물리화학적 특성 */}
        <section className="card form-card">
          <h3>물리화학적 특성 (선택)</h3>
          <div className="chemical-props-grid">
            <label>외관
              <input value={form.chemicalProperty.appearance} onChange={(e) => setField('chemicalProperty.appearance', e.target.value)} />
            </label>
            <label>냄새
              <input value={form.chemicalProperty.odor} onChange={(e) => setField('chemicalProperty.odor', e.target.value)} />
            </label>
            <label>pH (0~14)
              <input type="number" min={0} max={14} step="0.1" value={form.chemicalProperty.ph} onChange={(e) => setField('chemicalProperty.ph', e.target.value)} />
            </label>
            <label>녹는점 (℃)
              <input type="number" step="0.1" value={form.chemicalProperty.meltingPoint} onChange={(e) => setField('chemicalProperty.meltingPoint', e.target.value)} />
            </label>
            <label>끓는점 (℃)
              <input type="number" step="0.1" value={form.chemicalProperty.boilingPoint} onChange={(e) => setField('chemicalProperty.boilingPoint', e.target.value)} />
            </label>
            <label>인화점 (℃)
              <input type="number" step="0.1" value={form.chemicalProperty.flashPoint} onChange={(e) => setField('chemicalProperty.flashPoint', e.target.value)} />
            </label>
            <label>발화점 (℃)
              <input type="number" step="0.1" value={form.chemicalProperty.ignitionPoint} onChange={(e) => setField('chemicalProperty.ignitionPoint', e.target.value)} />
            </label>
          </div>
        </section>

        <div className="button-row">
          <button type="button" className="btn btn-outline" onClick={() => navigate('/chemicals')}>취소</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? '등록 중...' : '등록'}
          </button>
        </div>
      </form>
    </div>
  );
}
