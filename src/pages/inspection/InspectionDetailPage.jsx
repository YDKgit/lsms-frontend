import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import InspectionSubNav from '../../components/inspection/InspectionSubNav';
import {
  downloadInspectionExcel,
  getInspection,
  updateInspectionAction,
} from '../../api/inspection';
import { getLabs } from '../../api/lab';
import { useAuth } from '../../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

function resolveFileUrl(filePath) {
  if (!filePath) return null;
  if (filePath.startsWith('http')) return filePath;
  const idx = filePath.replace(/\\/g, '/').indexOf('uploads/');
  if (idx === -1) return null;
  return `${API_BASE}/${filePath.replace(/\\/g, '/').slice(idx)}`;
}

const INSPECTION_TYPE_LABEL = {
  DAILY: '일상점검',
  REGULAR: '정기점검',
  PRECISION: '정밀안전진단',
  OCCASIONAL: '수시점검',
};

export default function InspectionDetailPage() {
  const { inspectionId } = useParams();
  const { token, hasRole } = useAuth();
  const navigate = useNavigate();
  const [inspection, setInspection] = useState(null);
  const [labId, setLabId] = useState(null);
  const [error, setError] = useState('');
  const [actionInputs, setActionInputs] = useState({});

  const canUpdateAction = hasRole('SYSTEM_ADMIN', 'LAB_MANAGER', 'SAFETY_MANAGEMENT_TEAM');
  const isDaily = inspection?.inspectionType === 'DAILY';

  const load = () => {
    getInspection(token, inspectionId)
      .then((data) => {
        setInspection(data);
        const inputs = {};
        (data.detailList || []).forEach((d) => {
          inputs[d.detailId] = d.actionResult || '';
        });
        setActionInputs(inputs);
        // 연구실 이름으로 labId 매칭
        getLabs(token).then((labs) => {
          const matched = labs.find((l) => l.labName === data.labName);
          if (matched) setLabId(matched.labId);
        }).catch(() => {});
      })
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    load();
  }, [token, inspectionId]);

  const [savingId, setSavingId] = useState(null);

  const handleActionUpdate = async (detailId) => {
    const status = actionInputs[detailId]?.trim();
    if (!status || savingId === detailId) return;
    setSavingId(detailId);
    try {
      await updateInspectionAction(token, detailId, status);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  };

  const handleDownload = async () => {
    try {
      await downloadInspectionExcel(token, inspectionId);
    } catch (err) {
      setError(err.message);
    }
  };

  if (error && !inspection) return <p className="error-text">{error}</p>;
  if (!inspection) return <p>불러오는 중...</p>;

  return (
    <div className="page">
      <div className="page-header">
        <h2>점검 관리</h2>
        <div className="button-row">
          {isDaily && (
            <button type="button" className="btn btn-outline" onClick={handleDownload}>엑셀 다운로드</button>
          )}
        </div>
      </div>
      <InspectionSubNav />
      <h3 className="inspection-section-title">점검 상세</h3>

      {error && <p className="error-text">{error}</p>}

      <section className="card">
        <h3>기본 정보</h3>
        <dl className="detail-grid">
          <dt>연구실</dt>
          <dd>
            {labId ? (
              <button type="button" className="link-btn" onClick={() => navigate(`/labs/${labId}`)}>
                {inspection.labName} →
              </button>
            ) : (inspection.labName ?? '-')}
          </dd>
          <dt>점검자</dt><dd>{inspection.inspectorName}</dd>
          <dt>점검일</dt><dd>{inspection.inspectionDate}</dd>
          <dt>점검 유형</dt><dd>{INSPECTION_TYPE_LABEL[inspection.inspectionType] || inspection.inspectionType}</dd>
          <dt>점검 방식</dt><dd>{inspection.inspectionMethod || '-'}</dd>
          <dt>점검 등급</dt><dd>{inspection.inspectionGrade ?? '-'}</dd>
          <dt>책임자 열람</dt><dd>{inspection.readDateTime || '미확인'}</dd>
        </dl>
      </section>

      <section className="card">
        <h3>지적 사항 / 조치 내역</h3>
        {!inspection.detailList?.length ? (
          <p className="muted-text">지적 사항이 없습니다. (양호)</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>지적 내용</th>
                <th>현장 사진</th>
                <th>조치 결과</th>
                <th>조치 일시</th>
                {canUpdateAction && <th>조치 갱신</th>}
              </tr>
            </thead>
            <tbody>
              {inspection.detailList.map((detail) => {
                const imgUrl = resolveFileUrl(detail.attachedFile);
                return (
                <tr key={detail.detailId}>
                  <td>{detail.problemDescribe}</td>
                  <td>
                    {imgUrl ? (
                      <a href={imgUrl} target="_blank" rel="noreferrer">
                        <img src={imgUrl} alt="현장 사진" style={{ width: 80, height: 60, objectFit: 'cover', cursor: 'pointer' }} />
                      </a>
                    ) : '-'}
                  </td>
                  <td>{detail.actionResult || '미조치'}</td>
                  <td>{detail.actionDate || '-'}</td>
                  {canUpdateAction && (
                    <td>
                      <div className="action-update-row">
                        <input
                          value={actionInputs[detail.detailId] || ''}
                          placeholder="예: 수리 완료"
                          onChange={(e) => setActionInputs({ ...actionInputs, [detail.detailId]: e.target.value })}
                        />
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={() => handleActionUpdate(detail.detailId)}
                          disabled={savingId === detail.detailId}
                        >
                          {savingId === detail.detailId ? '저장 중...' : '저장'}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
