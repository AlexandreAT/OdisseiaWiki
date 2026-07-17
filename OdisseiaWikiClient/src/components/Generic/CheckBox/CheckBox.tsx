import { useState, memo, useCallback } from "react";
import { CheckboxLabel, ContainerController, InputCheckbox } from "./CheckBox.style";

interface Props {
    neon: 'on' | 'off';
    label: string;
    typeStyle?: 'primary' | 'secondary';
    width?: string;
    height?: string;
    fontSize?: string;
    checked?: boolean;
    onChange?: (checked: boolean) => void;
    disabled?: boolean;
}

const CheckBoxComponent = ({
    neon,
    label,
    typeStyle = "primary",
    width,
    height,
    fontSize,
    checked,
    onChange,
    disabled = false,
}: Props) => {
    const [internalChecked, setInternalChecked] = useState(false);
    const isChecked = checked !== undefined ? checked : internalChecked;

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (onChange) onChange(e.target.checked);
        else setInternalChecked(e.target.checked);
    }, [onChange]);

    return (
        <ContainerController width={width} height={height}>
            <InputCheckbox
                typeStyle={typeStyle}
                checked={isChecked}
                onChange={handleChange}
                id={`checkbox-${label}`}
                disabled={disabled}
            />
            <CheckboxLabel
                typeStyle={typeStyle}
                fontSize={fontSize}
                htmlFor={`checkbox-${label}`}
                neon={neon}
            >
                {label}
            </CheckboxLabel>
        </ContainerController>
    );
};

export const CheckBox = memo(CheckBoxComponent);
