import React, { useState, memo, useCallback, useMemo, useRef, useEffect } from "react";
import MUIDataTable from "mui-datatables";
import { TextField, IconButton } from "@mui/material";
import { Add, Delete, Visibility } from "@mui/icons-material";
import { Search } from "../Search/Search";
import { BiSearchAlt } from "react-icons/bi";
import {
  CellEditor,
  CharacterCounter,
  RowActions,
  DataTableContainer,
  TableScrollContainer,
  ValidationMessage,
} from "./DataTable.style";
import { Select } from "../Select/Select";
import { CheckSelect } from "../CheckSelect/CheckSelect";
import { revealFirstValidationError } from '../../../utils/formValidationFeedback';
import { handleNumericInputFocus } from '../../../utils/numericInput';

interface DataTableProps<T> {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  data: T[];
  onChange: (newData: T[]) => void;
  columns: ColumnConfig<T>[];
  searchable?: boolean;
  searchPlaceholder?: string;
  searchData?: T[];
  onSelectSearch?: (item: T) => void;
  searchKeys?: (keyof T)[];
  showEmptyRow?: boolean;
  error?: boolean;
  errorMessage?: string;
  isRowEmpty?: (row: T) => boolean;
  onViewRow?: (row: T) => void;
  canViewRow?: (row: T) => boolean;
}

interface ColumnConfig<T> {
  key: keyof T;
  label: string;
  width?: string | number;
  inputType?: "text" | "number" | "select" | "checkselect";
  maxLength?: number;
  options?: { label: string; value: string }[];
  customRender?: (
    value: any,
    row: T,
    onChange: (val: any) => void,
    onRowChange: (row: T) => void,
  ) => React.ReactNode;
}

const TableCell = memo(({ 
  value, 
  rowIndex,
  columnKey,
  column,
  theme,
  neon,
  onUpdate,
  onEnter
}: any) => {
  const handleChange = useCallback((newValue: any) => {
    onUpdate(rowIndex, columnKey, newValue);
  }, [rowIndex, columnKey, onUpdate]);

  if (column.inputType === "number") {
    return (
      <TextField
        type="number"
        fullWidth
        variant="standard"
        value={value ?? ""}
        onFocus={handleNumericInputFocus}
        onChange={(e) => handleChange(e.target.value === "" ? "" : Number(e.target.value))}
      />
    );
  }

  if (column.inputType === "select") {
    return (
      <Select
        theme={theme}
        neon={neon}
        label={column.label}
        value={value || ""}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleChange(e.target.value)}
        options={column.options || []}
        width="100%"
        portal
      />
    );
  }

  if (column.inputType === "checkselect") {
    return (
      <CheckSelect
        theme={theme}
        neon={neon}
        label={column.label}
        options={column.options || []}
        value={Array.isArray(value) ? value : []}
        onChange={(newValues: string[]) => handleChange(newValues)}
        width="100%"
      />
    );
  }


  const textValue = String(value ?? "");

  return (
    <CellEditor>
      <TextField
        fullWidth
        variant="standard"
        value={textValue}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={onEnter}
        inputProps={column.maxLength ? { maxLength: column.maxLength } : undefined}
      />
      {column.maxLength && (
        <CharacterCounter aria-live="polite">
          {textValue.length}/{column.maxLength}
        </CharacterCounter>
      )}
    </CellEditor>
  );
}, (prev, next) => {

  return prev.value === next.value && 
         prev.rowIndex === next.rowIndex &&
         prev.theme === next.theme &&
         prev.neon === next.neon &&
         prev.column.maxLength === next.column.maxLength;
});

function DataTableComponent<T extends { [key: string]: any }>({
  data,
  onChange,
  columns,
  searchable = false,
  searchPlaceholder = "Pesquisar...",
  theme,
  neon,
  searchData,
  onSelectSearch,
  searchKeys,
  showEmptyRow = false,
  error = false,
  errorMessage,
  isRowEmpty,
  onViewRow,
  canViewRow,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (error) revealFirstValidationError(containerRef.current);
  }, [error]);
  

  const dataRef = useRef(data);
  dataRef.current = data;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const createEmptyRow = useCallback(() => columns.reduce((acc, col) => {
    (acc as any)[col.key] = col.inputType === "number" ? 0 : "";
    return acc;
  }, {} as T), [columns]);

  const tableData = useMemo(
    () => data.length === 0 && showEmptyRow ? [createEmptyRow()] : data,
    [data, showEmptyRow, createEmptyRow],
  );
  const tableDataRef = useRef(tableData);
  tableDataRef.current = tableData;

  const rowIsEmpty = useCallback((row: T) => {
    if (isRowEmpty) return isRowEmpty(row);

    return Object.values(row).every((value) => {
      if (value === null || value === undefined || value === "") return true;
      if (typeof value === "string") return value.trim().length === 0;
      if (typeof value === "number") return value === 0;
      if (typeof value === "boolean") return value === false;
      if (Array.isArray(value)) return value.length === 0;
      if (typeof value === "object") return Object.keys(value).length === 0;
      return false;
    });
  }, [isRowEmpty]);


  const updateValue = useCallback((rowIndex: number, key: keyof T, value: any) => {
    const updated = [...dataRef.current];
    updated[rowIndex] = { ...updated[rowIndex], [key]: value };
    onChangeRef.current(updated);
  }, []);

  const updateRow = useCallback((rowIndex: number, row: T) => {
    const updated = [...dataRef.current];
    updated[rowIndex] = row;
    onChangeRef.current(updated);
  }, []);


  const handleEnter = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const inputs = document.querySelectorAll<HTMLInputElement>("input.MuiInputBase-input");
      const currentIndex = Array.from(inputs).indexOf(e.target as HTMLInputElement);
      if (currentIndex + 1 < inputs.length) {
        inputs[currentIndex + 1].focus();
      } else {
        const currentRows = tableDataRef.current;
        const lastRow = currentRows[currentRows.length - 1];
        if (!lastRow || !rowIsEmpty(lastRow)) {
          onChangeRef.current([...dataRef.current, createEmptyRow()]);
        }
      }
    }
  }, [createEmptyRow, rowIsEmpty]);


  const renderCell = useCallback((col: ColumnConfig<T>, rowIndex: number) => {
    const row = tableDataRef.current[rowIndex];
    if (!row) return null;

    const value = row[col.key];

    if (col.customRender) {
      return col.customRender(
        value,
        row,
        (val) => updateValue(rowIndex, col.key, val),
        (nextRow) => updateRow(rowIndex, nextRow),
      );
    }

    return (
      <TableCell
        value={value}
        rowIndex={rowIndex}
        columnKey={col.key}
        column={col}
        theme={theme}
        neon={neon}
        onUpdate={updateValue}
        onEnter={handleEnter}
      />
    );
  }, [theme, neon, updateValue, updateRow, handleEnter]);


  const muiColumns = useMemo(() => columns.map((col) => ({
    name: String(col.key),
    label: col.label,
    options: {
      customBodyRenderLite: (dataIndex: number) => renderCell(col, dataIndex),
      setCellProps: () => ({
        style: col.width ? { width: col.width, maxWidth: col.width } : {},
      }),
      setCellHeaderProps: () => ({
        style: {
          ...(col.width ? { width: col.width, maxWidth: col.width } : {}),
          textAlign: "center",
        },
      }),
    },
  })), [columns, renderCell]);

  const handleAddRow = useCallback(() => {
    const currentRows = tableDataRef.current;
    const lastRow = currentRows[currentRows.length - 1];
    if (lastRow && rowIsEmpty(lastRow)) return;

    onChangeRef.current([...dataRef.current, createEmptyRow()]);
  }, [createEmptyRow, rowIsEmpty]);

  const handleRemoveRow = useCallback((index: number) => {
    if (index < 0 || index >= dataRef.current.length) return;
    const updated = dataRef.current.filter((_, i) => i !== index);
    onChangeRef.current(updated);
  }, []);

  const searchSuggestions = useMemo(() => {
    if (!searchData || !searchKeys) return [];
    return searchData
      .filter(item =>
        searchKeys.some(key =>
          String(item[key]).toLowerCase().includes(search.toLowerCase())
        )
      )
      .map(item => item.nome);
  }, [searchData, searchKeys, search]);

  const handleSelectSuggestion = useCallback((nomeSelecionado: string) => {
    const itemSelecionado = searchData?.find(item => item.nome === nomeSelecionado);
    if (itemSelecionado) {
      onSelectSearch?.(itemSelecionado);
    }
    setSearch("");
  }, [searchData, onSelectSearch]);


  const actionsColumn = useMemo(() => ({
    name: "Ações",
    options: {
      filter: false,
      sort: false,
      customBodyRenderLite: (dataIndex: number) => {
        const isLastRow = dataIndex === tableData.length - 1;
        const row = tableData[dataIndex];
        const isEmpty = !row || rowIsEmpty(row);
        const isPersistedRow = dataIndex < data.length;
        const showView = Boolean(row && onViewRow && !isEmpty && (canViewRow?.(row) ?? true));
        return (
          <RowActions>
            {showView && (
              <IconButton
                type="button"
                onClick={() => onViewRow?.(row)}
                title="Visualizar"
                aria-label="Visualizar registro"
              >
                <Visibility className="iconView" />
              </IconButton>
            )}
            {isPersistedRow && (
              <IconButton
                type="button"
                onClick={() => handleRemoveRow(dataIndex)}
                title="Excluir"
                aria-label="Excluir linha"
              >
                <Delete className="iconDelete" />
              </IconButton>
            )}
            {isLastRow && !isEmpty && (
              <IconButton
                type="button"
                onClick={handleAddRow}
                title="Adicionar linha"
                aria-label="Adicionar linha"
              >
                <Add className="icon" />
              </IconButton>
            )}
          </RowActions>
        );
      },
    },
  }), [tableData, data.length, rowIsEmpty, onViewRow, canViewRow, handleAddRow, handleRemoveRow]);

  return (
    <DataTableContainer
      ref={containerRef}
      theme={theme}
      neon={neon}
      $error={error}
      data-validation-error={error || undefined}
    >
      {searchable && searchData && onSelectSearch && (
        <Search
          theme={theme}
          neon={neon}
          label={searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<BiSearchAlt className='icon' />}
          iconSize={20}
          suggestions={searchSuggestions}
          onSelectSuggestion={handleSelectSuggestion}
          portal
        />
      )}
      <TableScrollContainer>
        <MUIDataTable
          title=""
          data={tableData}
          columns={[...muiColumns, actionsColumn]}
          options={{
            search: false,
            filter: false,
            download: false,
            print: false,
            viewColumns: false,
            selectableRows: "none",
            pagination: false,
            responsive: "standard",
          }}
        />
      </TableScrollContainer>
      {error && errorMessage && <ValidationMessage role="alert">{errorMessage}</ValidationMessage>}
    </DataTableContainer>
  );
}

export const DataTable = memo(DataTableComponent) as typeof DataTableComponent;
