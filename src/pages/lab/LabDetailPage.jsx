import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import LabLayoutCanvas from '../../components/lab/LabLayoutCanvas';
import { getLab } from '../../api/lab';
import { useAuth } from '../../context/AuthContext';
import { parseLayoutData, resolveUploadUrl } from '../../utils/layoutData';

export default function LabDetailPage() {
  const { labId } = useParams();
  const { token } = useAuth();
  const [lab, setLab] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getLab(token, labId)
      .then(setLab)
      .catch((err) => setError(err.message));
  }, [token, labId]);

  if (error) return <p className="error-text">{error}</p>;
  if (!lab) return <p>불러오는 중...</p>;

  const floorPlanImageUrl = resolveUploadUrl(lab.floorPlanUrl);
  const layoutPlanImageUrl = resolveUploadUrl(lab.layoutUrl);
  const parsedLayout = parseLayoutData(lab.layoutData);
  const hasLayout = parsedLayout.objects.length > 0 || Boolean(layoutPlanImageUrl);

  return (
    <div className="page">
      <div className="page-header">
        <h2>연구실 상세</h2>
        <Link to="/labs" className="btn btn-outline">목록</Link>
      </div>

      <section className="card">
        <h3>기본 정보</h3>
        <dl className="detail-grid">
          <dt>연구실명</dt><dd>{lab.labName}</dd>
          <dt>위치</dt><dd>{lab.buildingLocation}</dd>
          <dt>유형</dt><dd>{lab.labType}</dd>
          <dt>등급</dt><dd>{lab.grade}</dd>
          <dt>점검대상</dt><dd>{lab.isInspectionTarget}</dd>
          <dt>담당자</dt><dd>{lab.managerName}</dd>
          <dt>부서</dt><dd>{lab.managerDepartment}</dd>
          <dt>연락처</dt><dd>{lab.contact}</dd>
        </dl>
      </section>

      <section className="card">
        <h3>안전장비</h3>
        {lab.equipDetails?.length ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>장비명</th>
                <th>수량</th>
                <th>분류</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {lab.equipDetails.map((eq) => (
                <tr key={eq.equipId}>
                  <td>{eq.equipName}</td>
                  <td>{eq.quantity}</td>
                  <td>{eq.category}</td>
                  <td>{eq.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="muted-text">등록된 장비가 없습니다.</p>
        )}
      </section>

      <section className="card">
        <h3>건물 평면도</h3>
        <p className="muted-text section-desc">건물 전체 층별 평면도 정보입니다.</p>
        {floorPlanImageUrl ? (
          <div className="floor-plan-preview detail-floor-preview">
            <img src={floorPlanImageUrl} alt="건물 평면도" />
          </div>
        ) : (
          <p className="muted-text">등록된 건물 평면도가 없습니다.</p>
        )}
      </section>

      <section className="card">
        <h3>연구실 배치도</h3>
        <p className="muted-text section-desc">연구실 내부 도면과 안전장비 배치 정보입니다.</p>
        {layoutPlanImageUrl && (
          <div className="floor-plan-preview detail-floor-preview">
            <img src={layoutPlanImageUrl} alt="연구실 내부 도면" />
          </div>
        )}
        {hasLayout ? (
          <div className="layout-detail-view">
            <h4>안전장비 격자 배치</h4>
            <LabLayoutCanvas
              readOnly
              equipList={lab.equipDetails || []}
              backgroundImageUrl={layoutPlanImageUrl}
              layoutData={lab.layoutData}
            />
          </div>
        ) : (
          <p className="muted-text">등록된 연구실 배치도가 없습니다.</p>
        )}
      </section>
    </div>
  );
}
