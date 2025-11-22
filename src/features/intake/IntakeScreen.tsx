import React, { useCallback, useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { intakeSchema, HealthProfile } from "./intake.schema";
import { Input } from "@/libs/ui/Input";
import { TextArea } from "@/libs/ui/TextArea";
import { GenderRadio } from "@/libs/ui/GenderRadio";
import { BooleanRadio } from "@/libs/ui/BooleanRadio";
import { MultiSelect, MultiSelectOption } from "@/libs/ui/MultiSelect";
import { Button } from "@/libs/ui/Button";
import "./IntakeScreen.css";

export const IntakeScreen = React.memo(() => {
  const navigate = useNavigate();
  const location = useLocation();
  const initialData = (location.state as { initialData?: HealthProfile })?.initialData;

  const [ageInputError, setAgeInputError] = useState<string | undefined>();
  const [weightInputError, setWeightInputError] = useState<string | undefined>();

  // 선택 옵션들 - useMemo로 메모이제이션
  const selectOptions = useMemo(
    () => ({
      healthConcerns: [
        { value: "피로", label: "피로" },
        { value: "소화불량", label: "소화불량" },
        { value: "수면장애", label: "수면장애" },
        { value: "스트레스", label: "스트레스" },
        { value: "관절통", label: "관절통" },
        { value: "두통", label: "두통" },
        { value: "면역력저하", label: "면역력 저하" },
        { value: "피부건조", label: "피부 건조" },
        { value: "탈모", label: "탈모" },
        { value: "기타", label: "기타" },
      ] as MultiSelectOption[],
      lifestyle: [
        { value: "운동_정기적", label: "운동 정기적" },
        { value: "운동_가끔", label: "운동 가끔" },
        { value: "운동_안함", label: "운동 안 함" },
        { value: "수면_양호", label: "수면 질 양호" },
        { value: "수면_보통", label: "수면 질 보통" },
        { value: "수면_나쁨", label: "수면 질 나쁨" },
        { value: "스트레스_높음", label: "스트레스 높음" },
        { value: "스트레스_보통", label: "스트레스 보통" },
        { value: "스트레스_낮음", label: "스트레스 낮음" },
        { value: "야근_자주", label: "야근 자주" },
        { value: "야근_가끔", label: "야근 가끔" },
        { value: "야근_안함", label: "야근 안 함" },
      ] as MultiSelectOption[],
    }),
    []
  );

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<HealthProfile>({
    resolver: zodResolver(intakeSchema),
    defaultValues: {
      age: initialData?.age,
      gender: initialData?.gender,
      weight: initialData?.weight,
      medications: initialData?.medications || "",
      concerns: initialData?.concerns || [],
      lifestyle: initialData?.lifestyle || [],
      smoking: initialData?.smoking,
    },
  });

  // initialData가 변경되면 폼을 업데이트
  useEffect(() => {
    if (location.state) {
      const state = location.state as { initialData?: HealthProfile };
      if (state.initialData) {
        reset({
          age: state.initialData.age,
          gender: state.initialData.gender,
          weight: state.initialData.weight,
          medications: state.initialData.medications || "",
          concerns: state.initialData.concerns || [],
          lifestyle: state.initialData.lifestyle || [],
          smoking: state.initialData.smoking,
        });
      } else if (state.initialData === undefined) {
        reset({
          age: undefined,
          gender: undefined,
          weight: undefined,
          medications: "",
          concerns: [],
          lifestyle: [],
          smoking: undefined,
        });
      }
    }
  }, [location.state, reset]);

  /**
   * 숫자만 입력 가능한지 검증하는 함수
   */
  const isNumericInput = (text: string): boolean => {
    if (text === "") return true;
    return /^[0-9]*\.?[0-9]*$/.test(text);
  };

  const onSubmit = useCallback(
    (data: HealthProfile) => {
      navigate("/recommendation-pending", {
        state: { profile: data },
      });
    },
    [navigate]
  );

  return (
    <div className="intake-screen-container">
      <div className="intake-screen-header">
        <h1 className="intake-screen-title">건강 정보 입력</h1>
        <p className="intake-screen-subtitle">
          맞춤형 영양제 추천을 위해 정보를 입력해주세요
        </p>
      </div>

      <div className="intake-screen-content">
        <form className="intake-screen-form" onSubmit={handleSubmit(onSubmit)}>
          <Controller
            control={control}
            name="age"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="나이"
                placeholder="예: 29"
                type="number"
                value={value?.toString() || ""}
                onChange={(e) => {
                  const text = e.target.value;
                  if (!isNumericInput(text)) {
                    setAgeInputError("숫자만 입력 가능합니다");
                    return;
                  }
                  setAgeInputError(undefined);

                  if (text === "") {
                    onChange(undefined);
                    return;
                  }

                  const numValue = parseInt(text, 10);
                  if (!isNaN(numValue)) {
                    onChange(numValue);
                  }
                }}
                onBlur={onBlur}
                error={ageInputError || errors.age?.message}
                required
              />
            )}
          />

          <Controller
            control={control}
            name="gender"
            render={({ field: { onChange, value } }) => (
              <GenderRadio
                value={value}
                onChange={onChange}
                error={errors.gender?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="weight"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="체중 (kg)"
                placeholder="예: 70"
                type="number"
                step="0.1"
                value={value?.toString() || ""}
                onChange={(e) => {
                  const text = e.target.value;
                  if (!isNumericInput(text)) {
                    setWeightInputError("숫자만 입력 가능합니다");
                    return;
                  }
                  setWeightInputError(undefined);

                  if (text === "") {
                    onChange(undefined);
                    return;
                  }

                  const numValue = parseFloat(text);
                  if (!isNaN(numValue)) {
                    onChange(numValue);
                  }
                }}
                onBlur={onBlur}
                error={weightInputError || errors.weight?.message}
                required
              />
            )}
          />

          <Controller
            control={control}
            name="smoking"
            render={({ field: { onChange, value } }) => (
              <BooleanRadio
                label="흡연 여부"
                value={value}
                onChange={onChange}
                error={errors.smoking?.message}
                required
                trueLabel="흡연"
                falseLabel="비흡연"
              />
            )}
          />

          <Controller
            control={control}
            name="medications"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextArea
                label="복용 중인 약물"
                placeholder="예: 마그네슘, 오메가3 (없으면 '없음' 입력)"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onBlur={onBlur}
                error={errors.medications?.message}
                required
              />
            )}
          />

          <Controller
            control={control}
            name="concerns"
            render={({ field: { onChange, value } }) => (
              <MultiSelect
                label="건강 고민"
                options={selectOptions.healthConcerns}
                value={value}
                onChange={onChange}
                error={errors.concerns?.message}
                required
              />
            )}
          />

          <Controller
            control={control}
            name="lifestyle"
            render={({ field: { onChange, value } }) => (
              <MultiSelect
                label="생활 패턴"
                options={selectOptions.lifestyle}
                value={value}
                onChange={onChange}
                error={errors.lifestyle?.message}
                required
              />
            )}
          />

          <Button
            title="추천 받기"
            type="submit"
            disabled={isSubmitting}
            loading={isSubmitting}
            className="intake-screen-submit-button"
          />
        </form>
      </div>
    </div>
  );
});

IntakeScreen.displayName = "IntakeScreen";
