import { forwardRef, useEffect, useMemo, useRef, useState, memo } from "react";
import { useEventCallback } from '../../../hooks/useEventCallback';
import CalculateIcon from "@mui/icons-material/Calculate";
import {
  CalculatorDropdown,
  CalculatorInput,
  CalculatorTrigger,
  ContentController,
  OverflowPlus,
  StatusLabel,
  StatusHeader,
  StatusInputField,
  StatusInputShell,
  StatusFill,
  StatusInputsRow,
  StatusMiniInput,
  StatusMiniInputWrapper,
  StatusValueGroup,
} from "./StatusInput.style";
import { selectNumericInputValue } from '../../../utils/numericInput';
import { FieldHelp } from '../FieldHelp/FieldHelp';
import type { FieldHelpContent } from '../FieldHelp/FieldHelp.types';

type StatusType = "vida" | "estamina" | "mana";

interface Props {
  theme: "dark" | "light";
  neon: "on" | "off";
  label?: string;
  type: StatusType;
  value?: string | number;
  maxValue?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onMaxChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  editable?: boolean;
  enableCalculator?: boolean;
  width?: string;
  height?: string;
  help?: FieldHelpContent;
  helpKey?: string;
}

const StatusInputComponent = forwardRef<HTMLInputElement, Props>(
  (
    {
      theme,
      neon,
      label,
      type,
      value,
      maxValue,
      onChange,
      onMaxChange,
      onBlur,
      onFocus,
      editable = true,
      enableCalculator = false,
      width,
      height,
      help,
      helpKey,
    },
    ref
  ) => {
    const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
    const [calculatorValue, setCalculatorValue] = useState("");
    const calculatorWrapperRef = useRef<HTMLDivElement | null>(null);
    const calculatorInputRef = useRef<HTMLInputElement | null>(null);

    const currentNumber = Number(value ?? 0);
    const maxNumber = Number(maxValue ?? 0);
    const hasDualValue = maxValue !== undefined || !!onMaxChange;
    const percentage = maxNumber > 0 ? Math.min((Math.max(currentNumber, 0) / maxNumber) * 100, 100) : 0;
    const showOverflowPlus = hasDualValue && currentNumber > maxNumber;
    const canUseCalculator = useMemo(
      () => enableCalculator && editable && !!onChange,
      [enableCalculator, editable, onChange]
    );

    const handleNumericFocus = (
      callback?: (event: React.FocusEvent<HTMLInputElement>) => void
    ) => (event: React.FocusEvent<HTMLInputElement>) => {
      selectNumericInputValue(event.currentTarget);
      callback?.(event);
    };

    const applyCalculatedValue = (rawExpression: string) => {
      if (!onChange) return;

      const expression = rawExpression.trim().replace(",", ".");
      if (!expression) return;

      const operator = expression.charAt(0);
      const operandRaw = expression.slice(1).trim();

      let nextValue = currentNumber;

      if (["+", "-", "*", "/"].includes(operator) && operandRaw) {
        const operand = Number(operandRaw);
        if (!Number.isFinite(operand)) return;

        if (operator === "+") nextValue = currentNumber + operand;
        if (operator === "-") nextValue = currentNumber - operand;
        if (operator === "*") nextValue = currentNumber * operand;
        if (operator === "/") {
          if (operand === 0) return;
          nextValue = currentNumber / operand;
        }
      } else {
        const absoluteValue = Number(expression);
        if (!Number.isFinite(absoluteValue)) return;
        nextValue = absoluteValue;
      }

      const normalized = Number.isFinite(nextValue) ? Math.round(nextValue * 100) / 100 : currentNumber;

      onChange({
        target: { value: String(normalized) },
      } as React.ChangeEvent<HTMLInputElement>);
    };

    useEffect(() => {
      if (!isCalculatorOpen) return;

      calculatorInputRef.current?.focus();

      const handleOutsideClick = (event: MouseEvent) => {
        if (!calculatorWrapperRef.current) return;
        if (!calculatorWrapperRef.current.contains(event.target as Node)) {
          setIsCalculatorOpen(false);
        }
      };

      document.addEventListener("mousedown", handleOutsideClick);
      return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, [isCalculatorOpen]);

    return (
      <ContentController width={width} height={height}>
        {(label || canUseCalculator || help || helpKey) && (
          <StatusHeader ref={calculatorWrapperRef}>
            {label ? <StatusLabel>{label}</StatusLabel> : <span />}

            {canUseCalculator && (
              <>
                <CalculatorTrigger
                  type="button"
                  theme={theme}
                  neon={neon}
                  onClick={() => setIsCalculatorOpen((prev) => !prev)}
                  title="Aplicar cálculo rápido"
                >
                  <CalculateIcon className="icon" />
                </CalculatorTrigger>

                {isCalculatorOpen && (
                  <CalculatorDropdown theme={theme} neon={neon}>
                    <CalculatorInput
                      ref={calculatorInputRef}
                      theme={theme}
                      neon={neon}
                      value={calculatorValue}
                      onChange={(event) => setCalculatorValue(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          applyCalculatedValue(calculatorValue);
                          setCalculatorValue("");
                          setIsCalculatorOpen(false);
                        }

                        if (event.key === "Escape") {
                          setIsCalculatorOpen(false);
                        }
                      }}
                      placeholder="+100 / -50 / *2"
                    />
                  </CalculatorDropdown>
                )}
              </>
            )}
            <FieldHelp label={label ?? type} help={help} helpKey={helpKey} theme={theme} neon={neon} inline />
          </StatusHeader>
        )}
        {hasDualValue ? (
          <StatusInputShell theme={theme} neon={neon} typeStatus={type} width={width} height={height}>
            <StatusFill typeStatus={type} percentage={percentage} />
            <StatusInputsRow>
              <StatusValueGroup emphasis="current">
                <StatusMiniInputWrapper>
                  <StatusMiniInput
                    align="left"
                    emphasis="current"
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    onFocus={handleNumericFocus(onFocus)}
                    readOnly={!editable || !onChange}
                    ref={ref}
                    type="number"
                  />
                  {showOverflowPlus && <OverflowPlus>+</OverflowPlus>}
                </StatusMiniInputWrapper>
              </StatusValueGroup>

              <StatusValueGroup emphasis="max">
                <StatusMiniInput
                  align="right"
                  emphasis="max"
                  value={maxValue}
                  onChange={onMaxChange}
                  onFocus={handleNumericFocus()}
                  readOnly={!editable || !onMaxChange}
                  type="number"
                />
              </StatusValueGroup>
            </StatusInputsRow>
          </StatusInputShell>
        ) : (
          <StatusInputField
            theme={theme}
            neon={neon}
            typeStatus={type}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            onFocus={handleNumericFocus(onFocus)}
            readOnly={!editable}
            ref={ref}
            width={width}
            height={height}
            type="number"
          />
        )}
      </ContentController>
    );
  }
);

StatusInputComponent.displayName = 'StatusInputControl';
const MemoizedStatusInput = memo(StatusInputComponent);
export const StatusInput = forwardRef<HTMLInputElement, Props>((props, ref) => {
  const onChange = useEventCallback(props.onChange);
  const onMaxChange = useEventCallback(props.onMaxChange);
  const onFocus = useEventCallback(props.onFocus);
  const onBlur = useEventCallback(props.onBlur);
  return <MemoizedStatusInput {...props} ref={ref} onChange={props.onChange ? onChange : undefined}
    onMaxChange={props.onMaxChange ? onMaxChange : undefined} onFocus={props.onFocus ? onFocus : undefined}
    onBlur={props.onBlur ? onBlur : undefined} />;
});
StatusInput.displayName = 'StatusInput';
