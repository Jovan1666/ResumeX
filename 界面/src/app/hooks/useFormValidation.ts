import { useState, useCallback, useMemo } from 'react';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  email?: boolean;
  phone?: boolean;
  url?: boolean;
  custom?: (value: string) => string | null;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// 内置验证规则
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^1[3-9]\d{9}$/;
const urlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/;

export function validateField(value: string, rules: ValidationRule, fieldName: string): string | null {
  if (rules.required && (!value || value.trim() === '')) {
    return `${fieldName}不能为空`;
  }

  if (value && rules.minLength && value.length < rules.minLength) {
    return `${fieldName}至少需要${rules.minLength}个字符`;
  }

  if (value && rules.maxLength && value.length > rules.maxLength) {
    return `${fieldName}不能超过${rules.maxLength}个字符`;
  }

  if (value && rules.email && !emailPattern.test(value)) {
    return '请输入有效的邮箱地址';
  }

  if (value && rules.phone && !phonePattern.test(value)) {
    return '请输入有效的手机号码';
  }

  if (value && rules.url && !urlPattern.test(value)) {
    return '请输入有效的网址';
  }

  if (value && rules.pattern && !rules.pattern.test(value)) {
    return `${fieldName}格式不正确`;
  }

  if (rules.custom) {
    return rules.custom(value);
  }

  return null;
}

export function useFormValidation<T extends Record<string, string>>(
  initialValues: T,
  validationRules: Partial<Record<keyof T, ValidationRule>>,
  fieldLabels?: Partial<Record<keyof T, string>>
) {
  const [values, setValues] = useState<T>(initialValues);
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

  // 验证单个字段
  const validateSingleField = useCallback((field: keyof T, value: string) => {
    const rules = validationRules[field];
    if (!rules) return null;
    
    const label = fieldLabels?.[field] || String(field);
    return validateField(value, rules, label);
  }, [validationRules, fieldLabels]);

  // 更新字段值
  const setValue = useCallback((field: keyof T, value: string) => {
    setValues(prev => ({ ...prev, [field]: value }));
    
    // 实时验证（如果已经触碰过该字段）
    if (touched[field]) {
      const error = validateSingleField(field, value);
      setErrors(prev => ({ ...prev, [field]: error || undefined }));
    }
  }, [touched, validateSingleField]);

  // 标记字段已触碰
  const setFieldTouched = useCallback((field: keyof T) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // 触碰时验证
    const error = validateSingleField(field, values[field]);
    setErrors(prev => ({ ...prev, [field]: error || undefined }));
  }, [values, validateSingleField]);

  // 验证所有字段
  const validateAll = useCallback((): ValidationResult => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    const validationErrors: ValidationError[] = [];

    for (const field of Object.keys(validationRules) as Array<keyof T>) {
      const error = validateSingleField(field, values[field]);
      if (error) {
        newErrors[field] = error;
        validationErrors.push({ field: String(field), message: error });
      }
    }

    setErrors(newErrors);
    setTouched(Object.keys(validationRules).reduce((acc, key) => {
      acc[key as keyof T] = true;
      return acc;
    }, {} as Record<keyof T, boolean>));

    return {
      isValid: validationErrors.length === 0,
      errors: validationErrors
    };
  }, [values, validationRules, validateSingleField]);

  // 重置表单
  const reset = useCallback(() => {
    setValues(initialValues);
    setTouched({});
    setErrors({});
  }, [initialValues]);

  // 计算是否有任何错误
  const hasErrors = useMemo(() => {
    return Object.values(errors).some(error => error);
  }, [errors]);

  // 获取字段属性（用于输入框）
  const getFieldProps = useCallback((field: keyof T) => ({
    value: values[field],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValue(field, e.target.value),
    onBlur: () => setFieldTouched(field),
    error: touched[field] ? errors[field] : undefined
  }), [values, touched, errors, setValue, setFieldTouched]);

  return {
    values,
    errors,
    touched,
    setValue,
    setFieldTouched,
    validateAll,
    reset,
    hasErrors,
    getFieldProps
  };
}

// 简化版：单独验证某个值
export function useFieldValidation(rules: ValidationRule, label: string = '此字段') {
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const validate = useCallback((value: string) => {
    const err = validateField(value, rules, label);
    setError(err);
    return err === null;
  }, [rules, label]);

  const touch = useCallback(() => {
    setTouched(true);
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setTouched(false);
  }, []);

  return {
    error: touched ? error : null,
    touched,
    validate,
    touch,
    reset
  };
}
