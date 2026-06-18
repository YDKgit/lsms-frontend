import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getChemical } from '../../api/chemical';
import { getLabs } from '../../api/lab';
import { useAuth } from '../../context/AuthContext';

const SIGNAL_LABEL = { DANGER: '위험', WARNING: '경고', Danger: '위험', Warning: '경고' };

function Row({ label, value }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <>
      <dt>{label}</dt>
      <dd>{String(value)}</dd>
    </>
  );
}

export default function ChemicalDetailPage() {
  const { chemicalId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [chemical, setChemical] = useState(null);
  const [labName, setLabName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    getChemical(token, chemicalId)
      .then((chem) => {
        setChemical(chem);
        if (chem.labId) {
          getLabs(token).then((labs) => {
            const matched = labs.find((l) => l.labId === chem.labId);
            if (matched) setLabName(matched.labName);
          }).catch(() => {});
        }
      })
      .catch((err) => setError(err.message));
  }, [token, chemicalId]);

  if (error && !chemical) return <p className="error-text">{error}</p>;
  if (!chemical) return <p>불러오는 중...</p>;

  const { capacityUnit: cu, hazardInfo: hi, chemicalProperty: cp } = chemical;
  const signalLabel = SIGNAL_LABEL[hi?.signalWord] ?? hi?.signalWord ?? '-';

  return (
    <div className="page">
      <div className="page-header">
        <h2>화학물질 상세</h2>
        <Link to="/chemicals" className="btn btn-outline">목록</Link>
      </div>

      {error && <p className="error-text">{error}</p>}

      <section className="card">
        <h3>기본 정보</h3>
        <dl className="detail-grid">
          <Row label="물질명" value={chemical.name} />
          <Row label="CAS번호" value={chemical.casNumber} />
          <Row label="CAT번호" value={chemical.catNumber} />
          <dt>연구실</dt>
          <dd>
            {chemical.labId ? (
              <button type="button" className="link-btn" onClick={() => navigate(`/labs/${chemical.labId}`)}>
                {labName || `연구실 #${chemical.labId}`} →
              </button>
            ) : '-'}
          </dd>
          <Row label="제조사" value={chemical.manufacturer} />
          <dt>보유량</dt>
          <dd>
            {chemical.amount}
            {cu ? ` ${cu.symbol} (${cu.name})` : ''}
          </dd>
        </dl>
      </section>

      <section className="card">
        <h3>위험·경고 정보</h3>
        <dl className="detail-grid">
          <dt>경고 등급</dt>
          <dd>
            <span className={`chemical-signal chemical-signal--${hi?.signalWord?.toLowerCase()}`}>
              {signalLabel}
            </span>
          </dd>
          <Row label="유해위험문구 (H)" value={hi?.hazardStatement} />
          <Row label="예방조치문구 (P)" value={hi?.precautionaryStatement} />
          <Row label="그림문자" value={hi?.pictogram} />
        </dl>
      </section>

      <section className="card">
        <h3>물리화학적 특성</h3>
        <dl className="detail-grid">
          <Row label="외관" value={cp?.appearance} />
          <Row label="냄새" value={cp?.odor} />
          <Row label="pH" value={cp?.ph} />
          <Row label="녹는점 (℃)" value={cp?.meltingPoint} />
          <Row label="끓는점 (℃)" value={cp?.boilingPoint} />
          <Row label="인화점 (℃)" value={cp?.flashPoint} />
          <Row label="발화점 (℃)" value={cp?.ignitionPoint} />
        </dl>
      </section>
    </div>
  );
}
