/**
 * Intake Schema Validation 테스트
 */

import { intakeSchema } from "@/features/intake/intake.schema";

describe("intakeSchema", () => {
  describe("정상 입력 검증", () => {
    it("모든 필드가 올바르게 입력된 경우 통과해야 함", () => {
      const validInput = {
        age: 29,
        gender: "male" as const,
        weight: 70,
        medications: "마그네슘",
        concerns: "피로감",
        lifestyle: "운동 3회/주",
      };

      const result = intakeSchema.safeParse(validInput);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.age).toBe(29);
        expect(result.data.gender).toBe("male");
        expect(result.data.weight).toBe(70);
      }
    });

    it("선택 필드가 비어있어도 통과해야 함", () => {
      const inputWithoutOptional = {
        age: 30,
        gender: "female" as const,
        weight: 60,
        medications: "",
        concerns: "",
        lifestyle: "",
      };

      const result = intakeSchema.safeParse(inputWithoutOptional);

      expect(result.success).toBe(true);
    });
  });

  describe("age 필드 검증", () => {
    it("유효한 나이를 허용해야 함", () => {
      const validAges = [1, 29, 50, 100, 150];

      validAges.forEach((age) => {
        const validInput = {
          age,
          gender: "male" as const,
          weight: 70,
          medications: "",
          concerns: "",
          lifestyle: "",
        };

        const result = intakeSchema.safeParse(validInput);
        expect(result.success).toBe(true);
      });
    });

    it("음수 나이를 거부해야 함", () => {
      const invalidInput = {
        age: -5,
        gender: "male" as const,
        weight: 70,
        medications: "",
        concerns: "",
        lifestyle: "",
      };

      const result = intakeSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("양수");
      }
    });

    it("0인 나이를 거부해야 함", () => {
      const invalidInput = {
        age: 0,
        gender: "male" as const,
        weight: 70,
        medications: "",
        concerns: "",
        lifestyle: "",
      };

      const result = intakeSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("양수");
      }
    });

    it("너무 큰 나이를 거부해야 함", () => {
      const invalidInput = {
        age: 200,
        gender: "male" as const,
        weight: 70,
        medications: "",
        concerns: "",
        lifestyle: "",
      };

      const result = intakeSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("150 이하");
      }
    });

    it("소수점 나이를 거부해야 함 (정수만 허용)", () => {
      const invalidAges = [29.5, 30.1, 25.99];

      invalidAges.forEach((age) => {
        const invalidInput = {
          age,
          gender: "male" as const,
          weight: 70,
          medications: "",
          concerns: "",
          lifestyle: "",
        };

        const result = intakeSchema.safeParse(invalidInput);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain("정수");
        }
      });
    });

    it("나이가 누락된 경우 에러를 반환해야 함", () => {
      const invalidInput = {
        gender: "male" as const,
        weight: 70,
        medications: "",
        concerns: "",
        lifestyle: "",
      };

      const result = intakeSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("나이");
      }
    });
  });

  describe("gender 필드 검증", () => {
    it("유효하지 않은 성별 값을 거부해야 함", () => {
      const invalidInput = {
        age: 29,
        gender: "invalid" as any,
        weight: 70,
        medications: "",
        concerns: "",
        lifestyle: "",
      };

      const result = intakeSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        // Zod enum 에러 메시지는 영어로 나올 수 있음
        expect(result.error.issues[0].message).toBeTruthy();
      }
    });

    it("성별이 누락된 경우 에러를 반환해야 함", () => {
      const invalidInput = {
        age: 29,
        weight: 70,
        medications: "",
        concerns: "",
        lifestyle: "",
      };

      const result = intakeSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
    });

    it("'male', 'female', 'other'는 모두 허용해야 함", () => {
      const genders = ["male", "female", "other"] as const;

      genders.forEach((gender) => {
        const input = {
          age: 29,
          gender,
          weight: 70,
          medications: "",
          concerns: "",
          lifestyle: "",
        };

        const result = intakeSchema.safeParse(input);
        expect(result.success).toBe(true);
      });
    });
  });

  describe("weight 필드 검증", () => {
    it("유효한 체중을 허용해야 함 (소수점 포함)", () => {
      const validWeights = [1, 50, 70, 70.5, 100.25, 500];

      validWeights.forEach((weight) => {
        const validInput = {
          age: 29,
          gender: "male" as const,
          weight,
          medications: "",
          concerns: "",
          lifestyle: "",
        };

        const result = intakeSchema.safeParse(validInput);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.weight).toBe(weight);
        }
      });
    });

    it("음수 체중을 거부해야 함", () => {
      const invalidInput = {
        age: 29,
        gender: "male" as const,
        weight: -10,
        medications: "",
        concerns: "",
        lifestyle: "",
      };

      const result = intakeSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("양수");
      }
    });

    it("0인 체중을 거부해야 함", () => {
      const invalidInput = {
        age: 29,
        gender: "male" as const,
        weight: 0,
        medications: "",
        concerns: "",
        lifestyle: "",
      };

      const result = intakeSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("양수");
      }
    });

    it("너무 큰 체중을 거부해야 함", () => {
      const invalidInput = {
        age: 29,
        gender: "male" as const,
        weight: 1000,
        medications: "",
        concerns: "",
        lifestyle: "",
      };

      const result = intakeSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("500");
      }
    });

    it("체중이 누락된 경우 에러를 반환해야 함", () => {
      const invalidInput = {
        age: 29,
        gender: "male" as const,
        medications: "",
        concerns: "",
        lifestyle: "",
      };

      const result = intakeSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("체중");
      }
    });
  });

  describe("문자열 필드 길이 제한", () => {
    it("500자를 초과하는 medications를 거부해야 함", () => {
      const longText = "a".repeat(501);
      const invalidInput = {
        age: 29,
        gender: "male" as const,
        weight: 70,
        medications: longText,
        concerns: "",
        lifestyle: "",
      };

      const result = intakeSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("500자 이하");
      }
    });

    it("500자를 초과하는 concerns를 거부해야 함", () => {
      const longText = "a".repeat(501);
      const invalidInput = {
        age: 29,
        gender: "male" as const,
        weight: 70,
        medications: "",
        concerns: longText,
        lifestyle: "",
      };

      const result = intakeSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
    });

    it("500자를 초과하는 lifestyle을 거부해야 함", () => {
      const longText = "a".repeat(501);
      const invalidInput = {
        age: 29,
        gender: "male" as const,
        weight: 70,
        medications: "",
        concerns: "",
        lifestyle: longText,
      };

      const result = intakeSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
    });

    it("정확히 500자는 허용해야 함", () => {
      const exactly500Chars = "a".repeat(500);
      const validInput = {
        age: 29,
        gender: "male" as const,
        weight: 70,
        medications: exactly500Chars,
        concerns: "",
        lifestyle: "",
      };

      const result = intakeSchema.safeParse(validInput);

      expect(result.success).toBe(true);
    });
  });

  describe("타입 불일치 검증", () => {
    it("age가 문자열인 경우 에러를 반환해야 함", () => {
      const invalidInput = {
        age: "29" as any,
        gender: "male" as const,
        weight: 70,
        medications: "",
        concerns: "",
        lifestyle: "",
      };

      const result = intakeSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("숫자");
      }
    });

    it("age가 null인 경우 에러를 반환해야 함", () => {
      const invalidInput = {
        age: null as any,
        gender: "male" as const,
        weight: 70,
        medications: "",
        concerns: "",
        lifestyle: "",
      };

      const result = intakeSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
    });

    it("age가 undefined인 경우 에러를 반환해야 함", () => {
      const invalidInput = {
        age: undefined as any,
        gender: "male" as const,
        weight: 70,
        medications: "",
        concerns: "",
        lifestyle: "",
      };

      const result = intakeSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
    });

    it("weight가 문자열인 경우 에러를 반환해야 함", () => {
      const invalidInput = {
        age: 29,
        gender: "male" as const,
        weight: "70" as any,
        medications: "",
        concerns: "",
        lifestyle: "",
      };

      const result = intakeSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("숫자");
      }
    });

    it("weight가 null인 경우 에러를 반환해야 함", () => {
      const invalidInput = {
        age: 29,
        gender: "male" as const,
        weight: null as any,
        medications: "",
        concerns: "",
        lifestyle: "",
      };

      const result = intakeSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
    });

    it("weight가 undefined인 경우 에러를 반환해야 함", () => {
      const invalidInput = {
        age: 29,
        gender: "male" as const,
        weight: undefined as any,
        medications: "",
        concerns: "",
        lifestyle: "",
      };

      const result = intakeSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
    });
  });
});
