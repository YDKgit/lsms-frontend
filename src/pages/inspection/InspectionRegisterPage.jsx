import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getActiveChecklist } from '../../api/checklist';
import InspectionSubNav from '../../components/inspection/InspectionSubNav';
import { registerInspection } from '../../api/inspection';
import { getLabs } from '../../api/lab';
import { useAuth } from '../../context/AuthContext';

const INSPECTION_TYPES = [
  { value: 'DAILY',      label: '일상점검' },
  { value: 'REGULAR',    label: '정기점검' },
  { value: 'PRECISION',  label: '정밀안전진단' },
  { value: 'OCCASIONAL', label: '수시점검' },
];

const EMPTY_DEFECT = { issueCategory: '', problemDescribe: '', file: null };

export default function InspectionRegisterPage() {
  const { token, user, hasRole } = useAuth();
  const navigate = useNavigate();
  const [labs, setLabs] = useState([]);
  const [checklist, setChecklist] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onlyDaily = hasRole('LAB_SAFETY_MANAGER') && !hasRole('SYSTEM_ADMIN', 'SAFETY_MANAGEMENT_TEAM');

  const [form, setForm] = useState({
    labID: '',
    inspectorID: user?.id || '',
    inspectionDate: new Date().toISOString().slice(0, 10),
    inspectionType: 'DAILY',
    inspectionMethod: 'ONLINE',
    inspectionGrade: 5,
  });

  const [results, setResults] = useState({});    // 체크리스트 결과 (DAILY + ONLINE)
  const [defects, setDefects] = useState([]);     // 체크리스트 기반 지적사항 (DAILY + ONLINE)
  const [freeDefects, setFreeDefects] = useState([{ ...EMPTY_DEFECT }]); // 자유 지적사항
  const [scanFile, setScanFile] = useState(null); // DAILY + OFFLINE 스캔 파일

  const isDaily = onlyDaily || form.inspectionType === 'DAILY';
  const isOnline = form.inspectionMethod === 'ONLINE';
  const showChecklist = isDaily && isOnline;
  const showScanUpload = isDaily && !isOnline;
  const showFreeDefects = !showChecklist; // OFFLINE 일상 or 기타 점검

  const canRegister = hasRole('SYSTEM_ADMIN', 'LAB_SAFETY_MANAGER', 'SAFETY_MANAGEMENT_TEAM');

  useEffect(() => {
    if (user?.id) setForm((prev) => ({ ...prev, inspectorID: user.id }));
  }, [user?.id]);

  useEffect(() => {
    if (!canRegister) return;
    Promise.all([getLabs(token), getActiveChecklist(token)])
      .then(([labList, checklistItems]) => {
        setLabs(labList);
        setChecklist(checklistItems);
        const initial = {};
        checklistItems.forEach((item) => { initial[item.id] = 'PASS'; });
        setResults(initial);
      })
      .catch((err) => setError(err.message));
  }, [token, canRegister]);

  if (!canRegister) {
    return (
      <div className="page">
        <h2>점검 등록</h2>
        <p className="error-text">이 기능을 사용할 권한이 없습니다.</p>
      </div>
    );
  }

  // 체크리스트 PASS/FAIL 처리
  const handleChecklistResult = (id, value) => {
    setResults((prev) => ({ ...prev, [id]: value }));
    if (value === 'PASS') {
      setDefects((prev) => prev.filter((d) => d.checklistId !== id));
    } else if (!defects.find((d) => d.checklistId === id)) {
      const item = checklist.find((c) => c.id === id);
      setDefects((prev) => [...prev, {
        checklistId: id,
        issueCategory: item?.category || '',
        problemDescribe: '',
        file: null,
      }]);
    }
  };

  const updateDefect = (checklistId, field, value) => {
    setDefects((prev) => prev.map((d) => (
      d.checklistId === checklistId ? { ...d, [field]: value } : d
    )));
  };

  // 자유 지적사항 처리
  const addFreeDefect = () => setFreeDefects((prev) => [...prev, { ...EMPTY_DEFECT }]);
  const updateFreeDefect = (index, field, value) => {
    setFreeDefects((prev) => prev.map((d, i) => (i === index ? { ...d, [field]: value } : d)));
  };
  const removeFreeDefect = (index) => {
    setFreeDefects((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (!form.labID || !form.inspectorID) throw new Error('연구실과 점검자 ID를 확인하세요.');

      // 체크리스트 기반 지적사항 유효성 검사
      if (showChecklist) {
        const invalid = defects.find((d) => !d.problemDescribe.trim());
        if (invalid) throw new Error('불량 항목의 지적 내용을 입력하세요.');
      }

      const formData = new FormData();
      formData.append('labID', String(form.labID));
      formData.append('inspectorID', String(form.inspectorID));
      formData.append('inspectionDate', form.inspectionDate);
      formData.append('inspectionType', onlyDaily ? 'DAILY' : form.inspectionType);
      formData.append('inspectionMethod', isDaily ? form.inspectionMethod : 'ONLINE');
      formData.append('inspectionGrade', String(form.inspectionGrade));

      // DAILY + OFFLINE: 스캔 파일
      if (showScanUpload && scanFile) {
        formData.append('scanFile', scanFile);
      }

      // 지적사항 목록 결정
      const finalDefects = showChecklist ? defects : freeDefects.filter((d) => d.problemDescribe.trim());

      finalDefects.forEach((defect, index) => {
        formData.append(`detailList[${index}].issueCategory`, defect.issueCategory || '');
        formData.append(`detailList[${index}].problemDescribe`, defect.problemDescribe);
        if (defect.file) formData.append(`detailList[${index}].attachedFile`, defect.file);
      });

      const inspectionId = await registerInspection(token, formData);
      navigate(`/inspections/${inspectionId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const grouped = checklist.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div className="page">
      <div className="page-header">
        <h2>점검 관리</h2>
        <button type="button" className="btn btn-outline" onClick={() => navigate('/inspections')}>취소</button>
      </div>
      <InspectionSubNav />
      <h3 className="inspection-section-title">점검 등록</h3>

      {error && <p className="error-text">{error}</p>}

      <form className="card form-card" onSubmit={handleSubmit}>
        <label>연구실
          <select required value={form.labID} onChange={(e) => setForm({ ...form, labID: e.target.value })}>
            <option value="">선택</option>
            {labs.map((lab) => <option key={lab.labId} value={lab.labId}>{lab.labName}</option>)}
          </select>
        </label>
        <label>점검자 ID
          <input type="number" required value={form.inspectorID} onChange={(e) => setForm({ ...form, inspectorID: e.target.value })} />
        </label>
        <label>점검일
          <input type="date" required value={form.inspectionDate} onChange={(e) => setForm({ ...form, inspectionDate: e.target.value })} />
        </label>
        <label>점검 유형
          <select
            value={onlyDaily ? 'DAILY' : form.inspectionType}
            disabled={onlyDaily}
            onChange={(e) => setForm({ ...form, inspectionType: e.target.value })}
          >
            {INSPECTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </label>

        {/* 일상점검만 온/오프라인 구분 */}
        {isDaily && (
          <label>점검 방식
            <select value={form.inspectionMethod} onChange={(e) => setForm({ ...form, inspectionMethod: e.target.value })}>
              <option value="ONLINE">온라인 (체크리스트)</option>
              <option value="OFFLINE">오프라인 (점검표 스캔)</option>
            </select>
          </label>
        )}

        <label>점검 등급 (1~5)
          <input
            type="number" min={1} max={5} step={0.1} required
            value={form.inspectionGrade}
            onChange={(e) => setForm({ ...form, inspectionGrade: e.target.value })}
          />
        </label>

        {/* 일상점검 온라인: 체크리스트 */}
        {showChecklist && (
          <>
            <h3>체크리스트</h3>
            {checklist.length === 0 && <p className="muted-text">활성 체크리스트가 없습니다.</p>}
            {Object.entries(grouped).map(([category, items]) => (
              <div key={category} className="checklist-group">
                <h4>{category}</h4>
                {items.map((item) => (
                  <div key={item.id} className="checklist-item-row">
                    <span>{item.content}</span>
                    <div className="button-row">
                      <button type="button" className={`btn btn-sm ${results[item.id] === 'PASS' ? 'btn-primary' : 'btn-outline'}`} onClick={() => handleChecklistResult(item.id, 'PASS')}>양호</button>
                      <button type="button" className={`btn btn-sm ${results[item.id] === 'FAIL' ? 'btn-danger' : 'btn-outline'}`} onClick={() => handleChecklistResult(item.id, 'FAIL')}>불량</button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
            {defects.length > 0 && (
              <>
                <h3>지적 사항</h3>
                {defects.map((defect) => (
                  <div key={defect.checklistId} className="defect-card">
                    <strong>{defect.issueCategory}</strong>
                    <label>지적 내용
                      <textarea required rows={2} value={defect.problemDescribe} onChange={(e) => updateDefect(defect.checklistId, 'problemDescribe', e.target.value)} />
                    </label>
                    <label>현장 사진 (선택)
                      <input type="file" accept="image/*" onChange={(e) => updateDefect(defect.checklistId, 'file', e.target.files?.[0] || null)} />
                    </label>
                  </div>
                ))}
              </>
            )}
          </>
        )}

        {/* 일상점검 오프라인: 점검표 스캔 업로드 */}
        {showScanUpload && (
          <>
            <h3>점검표 스캔본</h3>
            <label>점검표 사진 (PNG, JPG)
              <input type="file" accept="image/*,application/pdf" onChange={(e) => setScanFile(e.target.files?.[0] || null)} />
            </label>
            {scanFile && <p className="muted-text">선택된 파일: {scanFile.name}</p>}
          </>
        )}

        {/* 오프라인 일상 or 기타 점검: 지적사항 직접 입력 */}
        {showFreeDefects && (
          <>
            <h3>지적 사항</h3>
            <p className="muted-text">지적 사항이 없으면 비워두세요.</p>
            {freeDefects.map((defect, index) => (
              <div key={index} className="defect-card">
                <div className="button-row" style={{ justifyContent: 'flex-end' }}>
                  {freeDefects.length > 1 && (
                    <button type="button" className="btn btn-sm btn-outline" onClick={() => removeFreeDefect(index)}>삭제</button>
                  )}
                </div>
                <label>분야 (선택)
                  <input value={defect.issueCategory} onChange={(e) => updateFreeDefect(index, 'issueCategory', e.target.value)} placeholder="예: 전기, 소방, 화학" />
                </label>
                <label>지적 내용
                  <textarea rows={2} value={defect.problemDescribe} onChange={(e) => updateFreeDefect(index, 'problemDescribe', e.target.value)} />
                </label>
                <label>현장 사진 (선택)
                  <input type="file" accept="image/*" onChange={(e) => updateFreeDefect(index, 'file', e.target.files?.[0] || null)} />
                </label>
              </div>
            ))}
            <button type="button" className="btn btn-outline" onClick={addFreeDefect}>+ 지적사항 추가</button>
          </>
        )}

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? '저장 중...' : '점검 등록'}
        </button>
      </form>
    </div>
  );
}
