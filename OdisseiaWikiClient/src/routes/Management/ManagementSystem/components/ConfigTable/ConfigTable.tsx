import { ReactNode, useCallback } from 'react';
import AddIcon from '@mui/icons-material/Add';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import { selectNumericInputValue } from '../../../../../utils/numericInput';
import { SistemaValidationErrors } from '../../systemValidation';
import {
  CellError,
  EmptyTable,
  IconAction,
  RowActions,
  Table,
  TableCellControl,
  TableContainer,
  TableHeader,
  TableTitle,
  TableToolbar,
} from './ConfigTable.style';

export type ConfigTableColumnType = 'text' | 'number' | 'checkbox' | 'select' | 'textarea';

export interface ConfigTableColumn<T extends object> {
  key: keyof T;
  label: string;
  type?: ConfigTableColumnType;
  width?: string;
  min?: number;
  max?: number;
  step?: number;
  maxLength?: number;
  nullable?: boolean;
  options?: Array<{ label: string; value: string | number }>;
  placeholder?: string;
  render?: (
    value: T[keyof T],
    row: T,
    update: (value: T[keyof T]) => void,
  ) => ReactNode;
}

interface ConfigTableProps<T extends object> {
  title: string;
  description?: string;
  rows: T[];
  columns: ConfigTableColumn<T>[];
  createRow: () => T;
  onChange: (rows: T[]) => void;
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  readOnly?: boolean;
  errors?: SistemaValidationErrors;
  errorPath: string;
  toolbar?: ReactNode;
  emptyMessage?: string;
}

const cloneWithoutIdentity = <T extends object>(row: T): T => {
  const clone = JSON.parse(JSON.stringify(row)) as Record<string, unknown>;
  Object.keys(clone).forEach((key) => {
    if (/^id[A-Z_]/.test(key)) delete clone[key];
  });
  return clone as T;
};

const normalizeOrder = <T extends object>(rows: T[]): T[] => rows.map((row, index) => {
  if (!Object.prototype.hasOwnProperty.call(row, 'ordem')) return row;
  return { ...row, ordem: index + 1 };
});

export const ConfigTable = <T extends object>({
  title,
  description,
  rows,
  columns,
  createRow,
  onChange,
  theme,
  neon,
  readOnly = false,
  errors = {},
  errorPath,
  toolbar,
  emptyMessage = 'Nenhum registro configurado.',
}: ConfigTableProps<T>) => {
  const updateCell = useCallback((rowIndex: number, key: keyof T, value: T[keyof T]) => {
    onChange(rows.map((row, index) => (
      index === rowIndex ? { ...row, [key]: value } : row
    )));
  }, [onChange, rows]);

  const addRow = useCallback(() => {
    onChange(normalizeOrder([...rows, createRow()]));
  }, [createRow, onChange, rows]);

  const duplicateRow = useCallback((rowIndex: number) => {
    const duplicated = cloneWithoutIdentity(rows[rowIndex]);
    const next = [...rows];
    next.splice(rowIndex + 1, 0, duplicated);
    onChange(normalizeOrder(next));
  }, [onChange, rows]);

  const removeRow = useCallback((rowIndex: number) => {
    onChange(normalizeOrder(rows.filter((_, index) => index !== rowIndex)));
  }, [onChange, rows]);

  const moveRow = useCallback((rowIndex: number, direction: -1 | 1) => {
    const targetIndex = rowIndex + direction;
    if (targetIndex < 0 || targetIndex >= rows.length) return;
    const next = [...rows];
    [next[rowIndex], next[targetIndex]] = [next[targetIndex], next[rowIndex]];
    onChange(normalizeOrder(next));
  }, [onChange, rows]);

  const renderControl = (row: T, rowIndex: number, column: ConfigTableColumn<T>) => {
    const value = row[column.key];
    const errorKey = `${errorPath}.${rowIndex}.${String(column.key)}`;
    const error = errors[errorKey];
    const update = (nextValue: T[keyof T]) => updateCell(rowIndex, column.key, nextValue);

    if (column.render) {
      return (
        <TableCellControl $error={Boolean(error)} data-validation-error={error || undefined}>
          {column.render(value, row, update)}
          {error && <CellError role="alert">{error}</CellError>}
        </TableCellControl>
      );
    }

    if (column.type === 'checkbox') {
      return (
        <TableCellControl $error={Boolean(error)} data-validation-error={error || undefined}>
          <input
            type="checkbox"
            checked={Boolean(value)}
            disabled={readOnly}
            aria-label={column.label}
            onChange={(event) => update(event.target.checked as T[keyof T])}
          />
          {error && <CellError role="alert">{error}</CellError>}
        </TableCellControl>
      );
    }

    if (column.type === 'select') {
      return (
        <TableCellControl $error={Boolean(error)} data-validation-error={error || undefined}>
          <select
            value={String(value ?? '')}
            disabled={readOnly}
            aria-label={column.label}
            onChange={(event) => {
              const selected = column.options?.find((option) => String(option.value) === event.target.value);
              update((selected?.value ?? event.target.value) as T[keyof T]);
            }}
          >
            <option value="">Selecione</option>
            {column.options?.map((option) => (
              <option key={String(option.value)} value={String(option.value)}>{option.label}</option>
            ))}
          </select>
          {error && <CellError role="alert">{error}</CellError>}
        </TableCellControl>
      );
    }

    if (column.type === 'textarea') {
      return (
        <TableCellControl $error={Boolean(error)} data-validation-error={error || undefined}>
          <textarea
            value={String(value ?? '')}
            disabled={readOnly}
            aria-label={column.label}
            placeholder={column.placeholder}
            maxLength={column.maxLength}
            onChange={(event) => update(event.target.value as T[keyof T])}
          />
          {error && <CellError role="alert">{error}</CellError>}
        </TableCellControl>
      );
    }

    const isNumber = column.type === 'number';
    return (
      <TableCellControl $error={Boolean(error)} data-validation-error={error || undefined}>
        <input
          type={isNumber ? 'number' : 'text'}
          value={isNumber
            ? (column.nullable && (value === null || value === undefined) ? '' : Number(value ?? 0))
            : String(value ?? '')}
          disabled={readOnly}
          aria-label={column.label}
          placeholder={column.placeholder}
          min={column.min}
          max={column.max}
          step={column.step}
          maxLength={column.maxLength}
          onFocus={isNumber ? (event) => selectNumericInputValue(event.currentTarget) : undefined}
          onChange={(event) => update((
            isNumber
              ? (event.target.value === '' ? (column.nullable ? null : 0) : Number(event.target.value))
              : event.target.value
          ) as T[keyof T])}
        />
        {error && <CellError role="alert">{error}</CellError>}
      </TableCellControl>
    );
  };

  return (
    <TableContainer theme={theme} neon={neon} data-validation-error={errors[errorPath] || undefined}>
      <TableHeader>
        <div>
          <TableTitle>{title}</TableTitle>
          {description && <p>{description}</p>}
          {errors[errorPath] && <CellError role="alert">{errors[errorPath]}</CellError>}
        </div>
        <TableToolbar>
          {toolbar}
          {!readOnly && (
            <IconAction type="button" onClick={addRow} title={`Adicionar em ${title}`} aria-label={`Adicionar em ${title}`}>
              <AddIcon />
              <span>Adicionar</span>
            </IconAction>
          )}
        </TableToolbar>
      </TableHeader>

      {rows.length === 0 ? (
        <EmptyTable>{emptyMessage}</EmptyTable>
      ) : (
        <div className="system-table-scroll">
          <Table>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={String(column.key)} style={{ width: column.width }}>{column.label}</th>
                ))}
                {!readOnly && <th className="actions-column">Ações</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={`${errorPath}-${rowIndex}`}>
                  {columns.map((column) => (
                    <td key={String(column.key)}>{renderControl(row, rowIndex, column)}</td>
                  ))}
                  {!readOnly && (
                    <td>
                      <RowActions>
                        <IconAction
                          type="button"
                          onClick={() => moveRow(rowIndex, -1)}
                          disabled={rowIndex === 0}
                          title="Mover para cima"
                          aria-label="Mover linha para cima"
                        >
                          <ArrowUpwardIcon />
                        </IconAction>
                        <IconAction
                          type="button"
                          onClick={() => moveRow(rowIndex, 1)}
                          disabled={rowIndex === rows.length - 1}
                          title="Mover para baixo"
                          aria-label="Mover linha para baixo"
                        >
                          <ArrowDownwardIcon />
                        </IconAction>
                        <IconAction
                          type="button"
                          onClick={() => duplicateRow(rowIndex)}
                          title="Duplicar linha"
                          aria-label="Duplicar linha"
                        >
                          <ContentCopyIcon />
                        </IconAction>
                        <IconAction
                          type="button"
                          $danger
                          onClick={() => removeRow(rowIndex)}
                          title="Excluir linha"
                          aria-label="Excluir linha"
                        >
                          <DeleteIcon />
                        </IconAction>
                      </RowActions>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </TableContainer>
  );
};
