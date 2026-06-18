import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import InspectionSubNav from '../../components/inspection/InspectionSubNav';
import { getInspectionCalendar } from '../../api/inspection';
import { getLabs } from '../../api/lab';
import { useAuth } from '../../context/AuthContext';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function isPass(item) {
  return item.isPass ?? item.pass ?? item.defectCount === 0;
}

export default function InspectionCalendarPage() {
  const { token, isAuthenticated } = useAuth();
  const canView = isAuthenticated;
  const navigate = useNavigate();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [labId, setLabId] = useState('');
  const [labs, setLabs] = useState([]);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!canView) return;
    getLabs(token).then(setLabs).catch(() => {});
  }, [token, canView]);

  useEffect(() => {
    if (!canView) return;
    setLoading(true);
    setError('');
    getInspectionCalendar(token, { year, month, labId: labId || undefined })
      .then((data) => {
        let list = Array.isArray(data) ? data : [];
        if (labId) {
          const selectedLab = labs.find((l) => String(l.labId) === String(labId));
          if (selectedLab) {
            list = list.filter((item) => item.labName === selectedLab.labName);
          }
        }
        setEvents(list);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token, year, month, labId, labs]);

  const eventsByDate = useMemo(() => {
    const map = {};
    events.forEach((item) => {
      const day = item.inspectionDate;
      if (!map[day]) map[day] = [];
      map[day].push(item);
    });
    return map;
  }, [events]);

  if (!canView) {
    return (
      <div className="page">
        <h2>점검 관리</h2>
        <InspectionSubNav />
        <section className="card">
          <p className="muted-text">월별 점검 현황 조회 권한이 없습니다.</p>
        </section>
      </div>
    );
  }

  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(d);

  const changeMonth = (delta) => {
    const date = new Date(year, month - 1 + delta, 1);
    setYear(date.getFullYear());
    setMonth(date.getMonth() + 1);
  };

  const handleDayClick = (day) => {
    if (!day) return;
    const key = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayEvents = eventsByDate[key] || [];
    if (dayEvents.length === 1) {
      navigate(`/inspections/${dayEvents[0].inspectionId}`);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>점검 관리</h2>
        <Link to="/inspections/new" className="btn btn-primary">점검 등록</Link>
      </div>
      <InspectionSubNav />
      <h3 className="inspection-section-title">월별 점검 현황</h3>

      <div className="card filter-card inspection-calendar-toolbar">
        <button type="button" className="btn btn-outline btn-sm" onClick={() => changeMonth(-1)}>이전 달</button>
        <strong>{year}년 {month}월</strong>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => changeMonth(1)}>다음 달</button>
        <select value={labId} onChange={(e) => setLabId(e.target.value)}>
          <option value="">전체 연구실</option>
          {labs.map((lab) => (
            <option key={lab.labId} value={lab.labId}>{lab.labName}</option>
          ))}
        </select>
      </div>

      <p className="muted-text calendar-legend">
        <span className="legend-dot pass" /> 양호
        <span className="legend-dot fail" /> 불량
      </p>

      {error && <p className="error-text">{error}</p>}
      {loading ? <p>불러오는 중...</p> : (
        <div className="card inspection-calendar">
          <div className="calendar-weekdays">
            {WEEKDAYS.map((w) => <div key={w}>{w}</div>)}
          </div>
          <div className="calendar-grid">
            {cells.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} className="calendar-cell empty" />;
              const key = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayEvents = eventsByDate[key] || [];
              return (
                <button
                  key={key}
                  type="button"
                  className={`calendar-cell${dayEvents.length ? ' has-events' : ''}`}
                  onClick={() => handleDayClick(day)}
                >
                  <span className="calendar-day">{day}</span>
                  <div className="calendar-dots">
                    {dayEvents.map((ev) => (
                      <span
                        key={ev.inspectionId}
                        className={`calendar-dot ${isPass(ev) ? 'pass' : 'fail'}`}
                        title={`${ev.inspectionType || '점검'} (${isPass(ev) ? '양호' : '불량'})`}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
