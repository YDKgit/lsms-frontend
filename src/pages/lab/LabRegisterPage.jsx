import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LabLayoutCanvas from '../../components/lab/LabLayoutCanvas';
import { getLabForm, getLabs, registerLab, saveLayout, uploadFloorPlan, uploadLayoutPlan } from '../../api/lab';
import { getUser } from '../../api/user';
import { useAuth } from '../../context/AuthContext';
import { createEmptyLayout, parseLayoutData, serializeLayoutData } from '../../utils/layoutData';

const EMPTY_EQUIP = { equipName: '', quantity: 1, category: 'FIRE', status: 'NORMAL' };

export default function LabRegisterPage() {
  const { token, hasRole, user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formOptions, setFormOptions] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [stepError, setStepError] = useState({ name: '', location: '', manager: '' });

  const [master, setMaster] = useState({
    labName: '',
    managerId: user?.id || 1,
    buildingLocation: '',
    labType: 'CHEMICAL',
    isInspectionTarget: 'Y',
    contact: '',
    grade: 'A',
    memberUserIds: [],
  });

  const [equipList, setEquipList] = useState([{ ...EMPTY_EQUIP }]);
  const [floorPlan, setFloorPlan] = useState({
    buildingName: '',
    floorLevel: '',
    imageFile: null,
    imagePreviewUrl: null,
    skip: true,
  });
  const [layoutPlan, setLayoutPlan] = useState({
    skip: true,
    imageFile: null,
    imagePreviewUrl: null,
  });
  const [layoutPlacement, setLayoutPlacement] = useState({
    skip: true,
    layoutData: serializeLayoutData(createEmptyLayout()),
  });

  const canRegister = hasRole('SYSTEM_ADMIN', 'LAB_MANAGER');

  useEffect(() => {
    if (!canRegister) return;
    getLabForm(token).then(setFormOptions).catch((err) => setError(err.message));
  }, [token, canRegister]);

  useEffect(() => () => {
    if (floorPlan.imagePreviewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(floorPlan.imagePreviewUrl);
    }
    if (layoutPlan.imagePreviewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(layoutPlan.imagePreviewUrl);
    }
  }, [floorPlan.imagePreviewUrl, layoutPlan.imagePreviewUrl]);

  if (!canRegister) {
    return (
      <div className="page">
        <h2>연구실 등록</h2>
        <p className="error-text">이 기능을 사용할 권한이 없습니다.</p>
      </div>
    );
  }

  const handleImageFile = (setter, previewUrl, file) => {
    if (previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    if (!file) {
      setter((prev) => ({ ...prev, imageFile: null, imagePreviewUrl: null }));
      return;
    }
    setter((prev) => ({
      ...prev,
      imageFile: file,
      imagePreviewUrl: URL.createObjectURL(file),
    }));
  };

  const handleFinalSave = async () => {
    setError('');
    setLoading(true);
    try {
      const parsedLayout = parseLayoutData(layoutPlacement.layoutData);
      const hasPlacement = !layoutPlacement.skip && parsedLayout.objects.length > 0;
      const hasLayoutPlan = !layoutPlan.skip && layoutPlan.imageFile;

      const body = {
        ...master,
        equipList: equipList.filter((eq) => eq.equipName.trim()),
        floorPlan: null,
        layout: null,
      };
      const created = await registerLab(token, body);

      if (!floorPlan.skip && floorPlan.imageFile) {
        await uploadFloorPlan(token, created.labId, {
          file: floorPlan.imageFile,
          buildingName: floorPlan.buildingName,
          floorLevel: floorPlan.floorLevel,
        });
      }

      if (hasLayoutPlan || hasPlacement) {
        let layoutFilePath = '';
        if (hasLayoutPlan) {
          const uploaded = await uploadLayoutPlan(token, created.labId, layoutPlan.imageFile);
          layoutFilePath = uploaded.filePath || '';
        }
        await saveLayout(token, created.labId, {
          filePath: layoutFilePath,
          layoutData: layoutPlacement.layoutData,
        });
      }

      navigate(`/labs/${created.labId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateEquip = (index, field, value) => {
    setEquipList((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const layoutPlanPreview = layoutPlan.skip ? null : layoutPlan.imagePreviewUrl;

  return (
    <div className="page">
      <div className="page-header">
        <h2>연구실 등록</h2>
        <button type="button" className="btn btn-outline" onClick={() => navigate('/labs')}>
          취소
        </button>
      </div>

      <div className="steps steps-5">
        <span className={step >= 1 ? 'active' : ''}>1. 기본정보</span>
        <span className={step >= 2 ? 'active' : ''}>2. 안전장비</span>
        <span className={step >= 3 ? 'active' : ''}>3. 건물 평면도</span>
        <span className={step >= 4 ? 'active' : ''}>4. 내부 도면</span>
        <span className={step >= 5 ? 'active' : ''}>5. 격자 배치</span>
      </div>

      <p className="muted-text register-hint">저장 버튼을 누르기 전까지 서버에 등록되지 않습니다.</p>

      {error && <p className="error-text">{error}</p>}

      {step === 1 && (
        <form className="card form-card" onSubmit={async (e) => {
          e.preventDefault();
          setStepError({ name: '', location: '', manager: '' });
          try {
            const [labs] = await Promise.all([getLabs(token)]);
            const name = master.labName.trim();
            const loc  = master.buildingLocation.trim();
            const nameDup = labs.some((l) => l.labName === name);
            const locDup  = labs.some((l) => l.buildingLocation === loc);

            let managerError = '';
            try {
              await getUser(token, master.managerId);
            } catch {
              managerError = '존재하지 않는 사용자 ID입니다.';
            }

            if (nameDup || locDup || managerError) {
              setStepError({
                name: nameDup ? '중복된 연구실 이름을 사용할 수 없습니다.' : '',
                location: locDup ? '중복된 위치를 사용할 수 없습니다.' : '',
                manager: managerError,
              });
              return;
            }
            setStep(2);
          } catch (err) {
            setStepError({ name: `중복 확인 중 오류가 발생했습니다: ${err.message}`, location: '', manager: '' });
          }
        }}>
          <label>
            연구실명
            <input required value={master.labName} onChange={(e) => { setStepError((p) => ({ ...p, name: '' })); setMaster({ ...master, labName: e.target.value }); }} />
            {stepError.name && <p className="error-text">{stepError.name}</p>}
          </label>
          <label>
            위치
            <input required value={master.buildingLocation} onChange={(e) => { setStepError((p) => ({ ...p, location: '' })); setMaster({ ...master, buildingLocation: e.target.value }); }} />
            {stepError.location && <p className="error-text">{stepError.location}</p>}
          </label>
          <label>
            담당자 ID
            <input
              type="number"
              required
              value={master.managerId}
              onChange={(e) => {
                setStepError((p) => ({ ...p, manager: '' }));
                setMaster({ ...master, managerId: Number(e.target.value) });
              }}
              onBlur={async (e) => {
                const id = Number(e.target.value);
                if (!id) return;
                try {
                  const u = await getUser(token, id);
                  setStepError((p) => ({ ...p, manager: '' }));
                  if (u?.phoneNumber) {
                    setMaster((prev) => ({ ...prev, contact: u.phoneNumber }));
                  }
                } catch {
                  setStepError((p) => ({ ...p, manager: '존재하지 않는 사용자 ID입니다.' }));
                }
              }}
            />
            {stepError.manager && <p className="error-text">{stepError.manager}</p>}
          </label>
          <label>유형
            <select value={master.labType} onChange={(e) => setMaster({ ...master, labType: e.target.value })}>
              {(formOptions?.labTypes || ['GENERAL', 'CHEMICAL', 'BIO']).map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label>등급
            <select value={master.grade} onChange={(e) => setMaster({ ...master, grade: e.target.value })}>
              {(formOptions?.grades || ['A', 'B', 'C']).map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </label>
          <label>점검대상
            <select value={master.isInspectionTarget} onChange={(e) => setMaster({ ...master, isInspectionTarget: e.target.value })}>
              {(formOptions?.inspectionTargetOptions || ['Y', 'N']).map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </label>
          <label>연락처<input value={master.contact} onChange={(e) => setMaster({ ...master, contact: e.target.value })} /></label>
          <button type="submit" className="btn btn-primary">다음</button>
        </form>
      )}

      {step === 2 && (
        <form className="card form-card" onSubmit={(e) => { e.preventDefault(); setStep(3); }}>
          {equipList.map((eq, index) => (
            <div key={index} className="equip-row">
              <input placeholder="장비명" value={eq.equipName} onChange={(e) => updateEquip(index, 'equipName', e.target.value)} />
              <input type="number" placeholder="수량" value={eq.quantity} onChange={(e) => updateEquip(index, 'quantity', Number(e.target.value))} />
              <select value={eq.category} onChange={(e) => updateEquip(index, 'category', e.target.value)}>
                <option value="FIRE">FIRE (소방)</option>
                <option value="MEDICAL">MEDICAL (의료)</option>
                <option value="CHEMICAL">CHEMICAL (화학)</option>
                <option value="GENERAL">GENERAL (일반)</option>
              </select>
              <input placeholder="상태" value={eq.status} onChange={(e) => updateEquip(index, 'status', e.target.value)} />
            </div>
          ))}
          <div className="equip-form-footer">
            <div className="button-row">
              <button type="button" className="btn btn-outline" onClick={() => setStep(1)}>이전</button>
              <button type="submit" className="btn btn-primary">다음</button>
            </div>
            <button type="button" className="btn btn-outline" onClick={() => setEquipList([...equipList, { ...EMPTY_EQUIP }])}>장비 추가</button>
          </div>
        </form>
      )}

      {step === 3 && (
        <div className="card form-card">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={floorPlan.skip}
              onChange={(e) => setFloorPlan({ ...floorPlan, skip: e.target.checked })}
            />
            건물 평면도 건너뛰기
          </label>
          {!floorPlan.skip && (
            <>
              <p className="muted-text">건물 전체 층별 평면도입니다. 연구실 내부 배치와는 별도로 관리됩니다.</p>
              <label>건물명<input value={floorPlan.buildingName} onChange={(e) => setFloorPlan({ ...floorPlan, buildingName: e.target.value })} /></label>
              <label>층<input type="number" value={floorPlan.floorLevel} onChange={(e) => setFloorPlan({ ...floorPlan, floorLevel: e.target.value })} /></label>
              <label>건물 평면도 (PNG, JPG)
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={(e) => handleImageFile(setFloorPlan, floorPlan.imagePreviewUrl, e.target.files?.[0] || null)}
                />
              </label>
              {floorPlan.imagePreviewUrl && (
                <div className="floor-plan-preview">
                  <img src={floorPlan.imagePreviewUrl} alt="건물 평면도 미리보기" />
                </div>
              )}
            </>
          )}
          <div className="button-row">
            <button type="button" className="btn btn-outline" onClick={() => setStep(2)}>이전</button>
            <button type="button" className="btn btn-primary" onClick={() => setStep(4)}>다음</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="card form-card">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={layoutPlan.skip}
              onChange={(e) => setLayoutPlan({ ...layoutPlan, skip: e.target.checked })}
            />
            내부 도면 건너뛰기
          </label>
          {!layoutPlan.skip && (
            <>
              <p className="muted-text">연구실 내부 배치도 도면을 등록합니다. 다음 단계에서 격자 위에 장비를 배치합니다.</p>
              <label>연구실 내부 도면 (PNG, JPG)
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={(e) => handleImageFile(setLayoutPlan, layoutPlan.imagePreviewUrl, e.target.files?.[0] || null)}
                />
              </label>
              {layoutPlan.imagePreviewUrl && (
                <div className="floor-plan-preview">
                  <img src={layoutPlan.imagePreviewUrl} alt="연구실 내부 도면 미리보기" />
                </div>
              )}
            </>
          )}
          <div className="button-row">
            <button type="button" className="btn btn-outline" onClick={() => setStep(3)}>이전</button>
            <button type="button" className="btn btn-primary" onClick={() => setStep(5)}>다음</button>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="card form-card">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={layoutPlacement.skip}
              onChange={(e) => setLayoutPlacement({ ...layoutPlacement, skip: e.target.checked })}
            />
            격자 배치 건너뛰기
          </label>
          {!layoutPlacement.skip && (
            <>
              <p className="muted-text">왼쪽에서 장비를 선택하고 격자 칸을 클릭해 배치하세요.</p>
              <LabLayoutCanvas
                equipList={equipList}
                backgroundImageUrl={layoutPlanPreview}
                layoutData={layoutPlacement.layoutData}
                onChange={(layoutData) => setLayoutPlacement({ ...layoutPlacement, layoutData })}
              />
            </>
          )}
          <div className="button-row">
            <button type="button" className="btn btn-outline" onClick={() => setStep(4)}>이전</button>
            <button type="button" className="btn btn-primary" disabled={loading} onClick={handleFinalSave}>
              {loading ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
