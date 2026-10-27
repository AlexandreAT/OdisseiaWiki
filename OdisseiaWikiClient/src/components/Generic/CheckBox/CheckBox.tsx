import { useState, memo, useCallback, useId } from "react";
import { useEventCallback } from '../../../hooks/useEventCallback';
import { FieldHelp } from '../FieldHelp/FieldHelp';
import type { FieldHelpContent } from '../FieldHelp/FieldHelp.types';
import { CheckboxLabel, ContainerController, InputCheckbox } from "./CheckBox.style";

interface Props {
    neon: 'on' | 'off';
    label: string;
    title?: string;
    typeStyle?: 'primary' | 'secondary';
    width?: string;
    height?: string;
    fontSize?: string;
    checked?: boolean;
    onChange?: (checked: boolean) => void;
    disabled?: boolean;
    help?: FieldHelpContent;
    helpKey?: string;
}

const CheckBoxComponent = ({
    neon,
    label,
    title,
    typeStyle = "primary",
    width,
    height,
    fontSize,
    checked,
    onChange,
    disabled = false,
    help,
    helpKey,
}: Props) => {
    const [internalChecked, setInternalChecked] = useState(false);
    const id = useId();
    const isChecked = checked !== undefined ? checked : internalChecked;

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (onChange) onChange(e.target.checked);
        else setInternalChecked(e.target.checked);
    }, [onChange]);

    return (
        <ContainerController width={width} height={height} title={title}>
            <InputCheckbox
                $neon={neon}
                checked={isChecked}
                onChange={handleChange}
                id={id}
                disabled={disabled}
            />
            <CheckboxLabel
                typeStyle={typeStyle}
                fontSize={fontSize}
                htmlFor={id}
                neon={neon}
            >
                {label}
            </CheckboxLabel>
            <FieldHelp label={label} help={help} helpKey={helpKey} neon={neon} inline />
        </ContainerController>
    );
};

const MemoizedCheckBox = memo(CheckBoxComponent);
export const CheckBox = (props: Props) => {
  const onChange = useEventCallback(props.onChange);
  return <MemoizedCheckBox {...props} onChange={props.onChange ? onChange : undefined} />;
};
