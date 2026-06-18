import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getChemicals } from '../../api/chemical';
import { getLabs } from '../../api/lab';
import { useAuth } from '../../context/AuthContext';

const SIGNAL_LABEL = { DANGER: '위험', WARNING: '경고', Danger: '위험', Warning: '경고' };

export default function ChemicalListPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [chemicals, setChemicals] = useState([]);
  const [labMap, setLabMap] = useState({});
  const [keyword, setKeyword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getChemicals(token), getLabs(token)])
      .then(([chems, labList]) => {
        setChemicals(chems);
        const map = {};
        (labList || []).forEach((l) => { map[l.labId] = l.labName; });
        setLabMap(map);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return chemicals;
    return chemicals.filter((c) =>
      [c.name, c.casNumber, c.catNumber, c.manufacturer, labMap[c.labId]]
        .some((v) => v?.toLowerCase().includes(q)),
    );
  }, [chemicals, keyword, labMap]);

  return (
    <div className="page">
      <div className="page-header">
        <h2>화학물질 관리</h2>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => navigate('/chemicals/new')}
        >
          화학물질 등록
        </button>
      </div>

      <div className="toolbar">
        <input
          type="search"
          placeholder="물질명·CAS번호·CAT번호·제조사·연구실명 검색"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </div>

      {error && <p className="error-text">{error}</p>}
      {loading ? (
        <p>불러오는 중...</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>물질명</th>
              <th>CAS번호</th>
              <th>CAT번호</th>
              <th>보관 연구실</th>
              <th>보유량</th>
              <th>경고 등급</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr
                key={c.id}
                className="clickable-row"
                onClick={() => navigate(`/chemicals/${c.id}`)}
              >
                <td>{c.id}</td>
                <td>{c.name}</td>
                <td>{c.casNumber}</td>
                <td>{c.catNumber}</td>
                <td>{labMap[c.labId] ?? c.labId ?? '-'}</td>
                <td>{c.amount} {c.capacityUnit?.symbol}</td>
                <td>
                  <span className={`chemical-signal chemical-signal--${c.hazardInfo?.signalWord?.toLowerCase()}`}>
                    {SIGNAL_LABEL[c.hazardInfo?.signalWord] ?? c.hazardInfo?.signalWord ?? '-'}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="empty-cell">데이터가 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
