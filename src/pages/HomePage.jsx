import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line,
} from 'recharts';
import { getLabs } from '../api/lab';
import { searchWastes } from '../api/waste';
import { getChemicals } from '../api/chemical';
import { getInspections } from '../api/inspection';
import { getEducations } from '../api/education';
import { useAuth } from '../context/AuthContext';

const PIE_COLORS = ['#2563eb', '#dc2626', '#f59e0b', '#10b981'];
const BAR_COLOR = '#2563eb';
const LINE_COLOR = '#10b981';

const WASTE_STATUS_LABEL = {
  STORED: '보관중',
  DISPOSAL_REQUESTED: '처분요청',
  COLLECTED: '수거완료',
  DISPOSED: '처리완료',
};

const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

function StatCard({ label, value, sub, color }) {
  return (
    <div className="dash-stat-card" style={{ borderTop: `4px solid ${color || 'var(--blue)'}` }}>
      <span className="dash-stat-label">{label}</span>
      <span className="dash-stat-value">{value}</span>
      {sub && <span className="dash-stat-sub">{sub}</span>}
    </div>
  );
}

function AlertBanner({ items }) {
  if (!items.length) return null;
  return (
    <div className="dash-alert-banner">
      {items.map((item, i) => (
        <div key={i} className={`dash-alert-item dash-alert-item--${item.level}`}>
          <span className="dash-alert-icon">{item.level === 'danger' ? '🚨' : '⚠️'}</span>
          <span>{item.message}</span>
        </div>
      ))}
    </div>
  );
}

/* ── 관리자 / 안전관리팀 대시보드 ── */
function AdminDashboard({ token }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    Promise.allSettled([
      getLabs(token),
      searchWastes(token, {}),
      getChemicals(token),
      getInspections(token),
    ]).then(([labsR, wastesR, chemsR, inspsR]) => {
      const labs    = labsR.value    ?? [];
      const wastes  = wastesR.value  ?? [];
      const chems   = chemsR.value   ?? [];
      const insps   = inspsR.value   ?? [];
      const inspForbidden = inspsR.status === 'rejected';

      // Bar: 월별 점검 건수
      const inspMonthCount = Array(12).fill(0);
      insps.forEach(ins => {
        if (!ins.inspectionDate) return;
        const m = new Date(ins.inspectionDate).getMonth();
        inspMonthCount[m]++;
      });
      const inspBarData = MONTHS.map((m, i) => ({ name: m, count: inspMonthCount[i] }));

      // Pie: 폐기물 상태별 현황
      const statusMap = {};
      wastes.forEach(w => {
        const s = w.status || '기타';
        statusMap[s] = (statusMap[s] || 0) + 1;
      });
      const wastePieData = Object.entries(statusMap).map(([status, value]) => ({
        name: WASTE_STATUS_LABEL[status] || status,
        value,
      }));

      // Line: 월별 폐기물 발생량
      const monthCount = Array(12).fill(0);
      wastes.forEach(w => {
        if (!w.registeredAt) return;
        const m = new Date(w.registeredAt).getMonth();
        monthCount[m]++;
      });
      const lineData = MONTHS.map((m, i) => ({ name: m, count: monthCount[i] }));

      // 최근 화학물질 5건
      const recentChems = [...chems].sort((a,b) => b.id - a.id).slice(0, 5);

      // 최근 미조치 지적사항
      const defects = [];
      insps.forEach(ins => {
        (ins.detailList || []).forEach(d => {
          if (!d.actionResult) defects.push({ inspectionID: ins.inspectionID, labName: ins.labName, date: ins.inspectionDate, ...d });
        });
      });
      const recentDefects = defects.slice(0, 5);

      setData({ labs, wastes, chems, inspTotal: insps.length, inspBarData, wastePieData, lineData, recentChems, recentDefects, inspForbidden });
    });
  }, [token]);

  if (!data) return <p className="dash-loading">대시보드 로딩 중...</p>;

  return (
    <div className="dash">

      {/* 통계 카드 */}
      <div className="dash-stats">
        <StatCard label="등록 연구실" value={data.labs.length} color="#2563eb" />
        <StatCard label="전체 화학물질" value={data.chems.length} color="#7c3aed" />
        <StatCard label="전체 폐기물" value={data.wastes.length} sub={`처분요청 ${data.wastes.filter(w=>w.status==='DISPOSAL_REQUESTED').length}건`} color="#dc2626" />
        <StatCard label="전체 점검" value={data.inspTotal} color="#10b981" />
      </div>

      {/* 차트 영역 */}
      <div className="dash-charts">
        {/* Bar: 월별 점검 건수 */}
        <div className="dash-chart-card">
          <h3 className="dash-chart-title">월별 점검 건수</h3>
          {data.inspForbidden ? <p className="dash-empty">조회 권한이 없습니다.</p> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.inspBarData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="건수" fill={BAR_COLOR} radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie: 폐기물 상태별 현황 */}
        <div className="dash-chart-card">
          <h3 className="dash-chart-title">폐기물 상태별 현황</h3>
          {data.wastePieData.length === 0 ? <p className="dash-empty">데이터 없음</p> : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <Pie
                  data={data.wastePieData}
                  cx="50%" cy="45%"
                  innerRadius={50} outerRadius={80}
                  dataKey="value"
                  paddingAngle={3}
                >
                  {data.wastePieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value}건`, name]} />
                <Legend
                  iconType="circle"
                  iconSize={10}
                  formatter={(value, entry) => `${value} (${entry.payload.value}건)`}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Line: 월별 폐기물 발생량 */}
        <div className="dash-chart-card">
          <h3 className="dash-chart-title">월별 폐기물 발생량</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.lineData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" name="건수" stroke={LINE_COLOR} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 하단 테이블 */}
      <div className="dash-tables">
        <div className="dash-table-card">
          <h3 className="dash-chart-title">미조치 점검 지적사항</h3>
          {data.inspForbidden ? <p className="dash-empty">조회 권한이 없습니다.</p> : data.recentDefects.length === 0 ? <p className="dash-empty">미조치 지적사항 없음</p> : (
            <table className="dash-mini-table">
              <thead><tr><th>연구실</th><th>분류</th><th>내용</th></tr></thead>
              <tbody>
                {data.recentDefects.map((d, i) => (
                  <tr key={i} className="clickable-row" onClick={() => navigate(`/inspections/${d.inspectionID}`)}>
                    <td>{d.labName}</td>
                    <td>{d.issueCategory}</td>
                    <td className="dash-cell-truncate">{d.problemDescribe}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="dash-table-card">
          <h3 className="dash-chart-title">최근 등록 화학물질</h3>
          {data.recentChems.length === 0 ? <p className="dash-empty">등록된 화학물질 없음</p> : (
            <table className="dash-mini-table">
              <thead><tr><th>물질명</th><th>CAS번호</th><th>위험도</th></tr></thead>
              <tbody>
                {data.recentChems.map(c => (
                  <tr key={c.id} className="clickable-row" onClick={() => navigate(`/chemicals/${c.id}`)}>
                    <td>{c.name}</td>
                    <td>{c.casNumber}</td>
                    <td>
                      <span className={`chemical-signal chemical-signal--${c.hazardInfo?.signalWord?.toLowerCase()}`}>
                        {c.hazardInfo?.signalWord === 'DANGER' ? '위험' : c.hazardInfo?.signalWord === 'WARNING' ? '경고' : '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── 연구실 책임자 / 연구실 안전담당자 대시보드 ── */
function LabDashboard({ token }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    Promise.allSettled([
      searchWastes(token, {}),
      getInspections(token),
    ]).then(([wastesR, inspsR]) => {
      const wastes = wastesR.value ?? [];
      const insps  = inspsR.value  ?? [];

      const disposalCount = wastes.filter(w => w.status === 'DISPOSAL_REQUESTED').length;

      const scoreMap = {};
      insps.forEach(ins => {
        if (ins.inspectionGrade == null) return;
        if (!scoreMap[ins.labName]) scoreMap[ins.labName] = { sum: 0, cnt: 0 };
        scoreMap[ins.labName].sum += ins.inspectionGrade;
        scoreMap[ins.labName].cnt += 1;
      });
      const barData = Object.entries(scoreMap).map(([name, v]) => ({
        name: name.replace(' 연구실', ''),
        score: Math.round(v.sum / v.cnt),
      }));

      const defects = [];
      insps.forEach(ins => {
        (ins.detailList || []).forEach(d => {
          if (!d.actionResult) defects.push({ labName: ins.labName, date: ins.inspectionDate, ...d });
        });
      });

      const alerts = [];
      if (disposalCount > 0) alerts.push({ level: 'danger', message: `처분 요청 상태의 폐기물이 ${disposalCount}건 있습니다.` });

      setData({ wastes, barData, defects: defects.slice(0, 5), alerts });
    });
  }, [token]);

  if (!data) return <p className="dash-loading">대시보드 로딩 중...</p>;

  return (
    <div className="dash">
      <AlertBanner items={data.alerts} />

      <div className="dash-stats">
        <StatCard label="전체 폐기물" value={data.wastes.length} color="#dc2626" />
        <StatCard label="처분요청 폐기물" value={data.wastes.filter(w=>w.status==='DISPOSAL_REQUESTED').length} color="#f59e0b" />
        <StatCard label="점검 연구실 수" value={data.barData.length} color="#2563eb" />
      </div>

      <div className="dash-charts">
        <div className="dash-chart-card" style={{ flex: 2 }}>
          <h3 className="dash-chart-title">연구실별 평균 점검 점수</h3>
          {data.barData.length === 0 ? <p className="dash-empty">점검 점수 데이터 없음</p> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.barData} margin={{ top: 5, right: 10, left: -10, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-30} textAnchor="end" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="score" name="점수" fill={BAR_COLOR} radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="dash-tables">
        <div className="dash-table-card" style={{ flex: 1 }}>
          <h3 className="dash-chart-title">미조치 점검 지적사항</h3>
          {data.defects.length === 0 ? <p className="dash-empty">미조치 지적사항 없음</p> : (
            <table className="dash-mini-table">
              <thead><tr><th>연구실</th><th>분류</th><th>내용</th></tr></thead>
              <tbody>
                {data.defects.map((d, i) => (
                  <tr key={i} className="clickable-row" onClick={() => navigate('/inspections')}>
                    <td>{d.labName}</td>
                    <td>{d.issueCategory}</td>
                    <td className="dash-cell-truncate">{d.problemDescribe}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── 교육 담당자 대시보드 ── */
function EduManagerDashboard({ token }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    getEducations(token)
      .then(eduList => {
        const total     = eduList.length;
        const completed = eduList.filter(e => e.completed ?? e.isCompleted).length;
        const inProgress = eduList.filter(e => {
          const rate = e.learningRate ?? 0;
          return rate > 0 && rate < 100;
        }).length;
        const notStarted = total - completed - inProgress;

        const pieData = [
          { name: '완료', value: completed },
          { name: '수강중', value: inProgress },
          { name: '미시작', value: notStarted },
        ].filter(d => d.value > 0);

        const catMap = {};
        eduList.forEach(e => {
          const cat = e.categoryName ?? '미분류';
          catMap[cat] = (catMap[cat] || 0) + 1;
        });
        const barData = Object.entries(catMap).map(([name, count]) => ({ name, count }));

        setData({ total, completed, inProgress, notStarted, pieData, barData, eduList });
      })
      .catch(() => setData({ total: 0, completed: 0, inProgress: 0, notStarted: 0, pieData: [], barData: [], eduList: [] }));
  }, [token]);

  if (!data) return <p className="dash-loading">대시보드 로딩 중...</p>;

  return (
    <div className="dash">
      <div className="dash-stats">
        <StatCard label="전체 교육 콘텐츠" value={data.total} color="#2563eb" />
        <StatCard label="내 이수 완료" value={data.completed} color="#10b981" />
        <StatCard label="수강 중" value={data.inProgress} color="#f59e0b" />
        <StatCard label="미시작" value={data.notStarted} color="#dc2626" />
      </div>

      <div className="dash-charts">
        <div className="dash-chart-card">
          <h3 className="dash-chart-title">내 수강 현황</h3>
          {data.pieData.length === 0 ? <p className="dash-empty">교육 콘텐츠 없음</p> : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <Pie
                  data={data.pieData}
                  cx="50%" cy="45%"
                  innerRadius={50} outerRadius={80}
                  dataKey="value"
                  paddingAngle={3}
                >
                  {data.pieData.map((_, i) => <Cell key={i} fill={['#10b981','#f59e0b','#dc2626'][i]} />)}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value}건`, name]} />
                <Legend iconType="circle" iconSize={10}
                  formatter={(value, entry) => `${value} (${entry.payload.value}건)`} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="dash-chart-card">
          <h3 className="dash-chart-title">카테고리별 콘텐츠 수</h3>
          {data.barData.length === 0 ? <p className="dash-empty">데이터 없음</p> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.barData} margin={{ top: 5, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="콘텐츠 수" fill={BAR_COLOR} radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="dash-tables">
        <div className="dash-table-card" style={{ flex: 1 }}>
          <h3 className="dash-chart-title">교육 콘텐츠 목록</h3>
          <table className="dash-mini-table">
            <thead><tr><th>제목</th><th>카테고리</th><th>내 진도</th><th>상태</th></tr></thead>
            <tbody>
              {data.eduList.map(e => (
                <tr key={e.contentId} className="clickable-row" onClick={() => navigate(`/education/${e.contentId}`)}>
                  <td>{e.title}</td>
                  <td>{e.categoryName}</td>
                  <td>
                    <div className="dash-progress-bar">
                      <div className="dash-progress-fill" style={{ width: `${e.learningRate ?? 0}%` }} />
                    </div>
                    <span className="dash-progress-text">{e.learningRate ?? 0}%</span>
                  </td>
                  <td>
                    <span className={`dash-badge ${(e.completed ?? e.isCompleted) ? 'dash-badge--green' : (e.learningRate > 0 ? 'dash-badge--yellow' : 'dash-badge--gray')}`}>
                      {(e.completed ?? e.isCompleted) ? '완료' : (e.learningRate > 0 ? '수강중' : '미시작')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ── 연구원 대시보드 ── */
function ResearcherDashboard({ token }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    Promise.allSettled([
      getEducations(token),
      searchWastes(token, {}),
    ]).then(([eduR, wastesR]) => {
      const eduList = eduR.value   ?? [];
      const wastes  = wastesR.value ?? [];

      const myWastes = wastes;
      const alerts = [];
      const incomplete = eduList.filter(e => !(e.completed ?? e.isCompleted));
      if (incomplete.length > 0)
        alerts.push({ level: 'warning', message: `미이수 안전교육이 ${incomplete.length}건 있습니다.` });

      setData({ eduList, myWastes, alerts });
    });
  }, [token]);

  if (!data) return <p className="dash-loading">대시보드 로딩 중...</p>;

  const completed  = data.eduList.filter(e => e.completed ?? e.isCompleted).length;
  const total      = data.eduList.length;

  return (
    <div className="dash">
      <AlertBanner items={data.alerts} />

      <div className="dash-stats">
        <StatCard label="안전교육 이수" value={`${completed} / ${total}`} color="#10b981"
          sub={total > 0 ? `이수율 ${Math.round(completed/total*100)}%` : undefined} />
        <StatCard label="내 폐기물 등록" value={data.myWastes.length} color="#7c3aed" />
      </div>

      <div className="dash-tables">
        <div className="dash-table-card" style={{ flex: 1 }}>
          <h3 className="dash-chart-title">내 안전교육 이수 현황</h3>
          {data.eduList.length === 0 ? <p className="dash-empty">등록된 교육 없음</p> : (
            <table className="dash-mini-table">
              <thead><tr><th>제목</th><th>카테고리</th><th>진도</th><th>상태</th></tr></thead>
              <tbody>
                {data.eduList.map(e => (
                  <tr key={e.contentId} className="clickable-row" onClick={() => navigate(`/education/${e.contentId}`)}>
                    <td>{e.title}</td>
                    <td>{e.categoryName}</td>
                    <td>
                      <div className="dash-progress-bar">
                        <div className="dash-progress-fill" style={{ width: `${e.learningRate ?? 0}%` }} />
                      </div>
                      <span className="dash-progress-text">{e.learningRate ?? 0}%</span>
                    </td>
                    <td>
                      <span className={`dash-badge ${(e.completed ?? e.isCompleted) ? 'dash-badge--green' : (e.learningRate > 0 ? 'dash-badge--yellow' : 'dash-badge--gray')}`}>
                        {(e.completed ?? e.isCompleted) ? '완료' : ((e.learningRate ?? 0) > 0 ? '수강중' : '미시작')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── 메인 홈 페이지 ── */
export default function HomePage() {
  const { token, user, hasRole } = useAuth();

  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  });

  const roleLabel = {
    SYSTEM_ADMIN:           '시스템 관리자',
    SAFETY_MANAGEMENT_TEAM: '안전관리팀',
    LAB_MANAGER:            '연구실 책임자',
    LAB_SAFETY_MANAGER:     '연구실 안전담당자',
    EDUCATION_MANAGER:      '교육 담당자',
    RESEARCHER:             '연구원',
    USER_MANAGER:           '사용자 관리자',
    SAFETY_MANAGEMENT_TEAM: '안전관리팀',
    AUTHORITY_MANAGER:      '권한 관리자',
  }[user?.role] ?? user?.role ?? '';

  const renderDashboard = () => <AdminDashboard token={token} />;

  return (
    <div className="page">
      <div className="dash-hero">
        <div>
          <h2 className="dash-hero-title">연구실 안전 관리 시스템</h2>
          <p className="dash-hero-date">{today}</p>
        </div>
        <div className="dash-hero-user">
          <span className="dash-role-badge">{roleLabel}</span>
          <span className="dash-username">{user?.name ?? user?.userId}님</span>
        </div>
      </div>

      {renderDashboard()}
    </div>
  );
}
