import React, { useState, memo, useCallback, useMemo, useRef } from "react";
import MUIDataTable from "mui-datatables";
import { TextField, IconButton } from "@mui/material";
import { Add, Delete } from "@mui/icons-material";
import { Search } from "../Search/Search";
import { BiSearchAlt } from "react-icons/bi";
import { DataTableContainer } from "./DataTable.style";
import { Select } from "../Select/Select";
import { CheckSelect } from "../CheckSelect/CheckSelect";

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
}

interface ColumnConfig<T> {
  key: keyof T;
  label: string;
  width?: string | number;
  inputType?: "text" | "number" | "select" | "checkselect";
  options?: { label: string; value: string }[];
  customRender?: (value: any, row: T, onChange: (val: any) => void) => React.ReactNode;
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
        value={value || ""}
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


  return (
    <TextField
      fullWidth
      variant="standard"
      value={value || ""}
      onChange={(e) => handleChange(e.target.value)}
      onKeyDown={onEnter}
    />
  );
}, (prev, next) => {

  return prev.value === next.value && 
         prev.rowIndex === next.rowIndex &&
         prev.theme === next.theme &&
         prev.neon === next.neon;
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
  searchKeys
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  

  const dataRef = useRef(data);
  dataRef.current = data;


  const updateValue = useCallback((rowIndex: number, key: keyof T, value: any) => {
    const updated = [...dataRef.current];
    updated[rowIndex] = { ...updated[rowIndex], [key]: value };
    onChange(updated);
  }, [onChange]);


  const handleEnter = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const inputs = document.querySelectorAll<HTMLInputElement>("input.MuiInputBase-input");
      const currentIndex = Array.from(inputs).indexOf(e.target as HTMLInputElement);
      if (currentIndex + 1 < inputs.length) {
        inputs[currentIndex + 1].focus();
      } else {
      
        const emptyRow = columns.reduce((acc, col) => {
          (acc as any)[col.key] = col.inputType === "number" ? 0 : "";
          return acc;
        }, {} as T);
        onChange([...dataRef.current, emptyRow]);
      }
    }
  }, [columns, onChange]);


  const renderCell = useCallback((col: ColumnConfig<T>, rowIndex: number) => {
    const row = data[rowIndex];
    const value = row[col.key];

    if (col.customRender) {
      return col.customRender(value, row, (val) => updateValue(rowIndex, col.key, val));
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
  }, [data, theme, neon, updateValue, handleEnter]);


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
    const emptyRow = columns.reduce((acc, col) => {
      (acc as any)[col.key] = col.inputType === "number" ? 0 : "";
      return acc;
    }, {} as T);
    onChange([...dataRef.current, emptyRow]);
  }, [columns, onChange]);

  const handleRemoveRow = useCallback((index: number) => {
    const updated = dataRef.current.filter((_, i) => i !== index);
    onChange(updated);
  }, [onChange]);

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
        const isLastRow = dataIndex === data.length - 1;
        return (
          <IconButton
            onClick={() => isLastRow ? handleAddRow() : handleRemoveRow(dataIndex)}
          >
            {isLastRow ? <Add className="icon" /> : <Delete className="iconDelete" />}
          </IconButton>
        );
      },
    },
  }), [data.length, handleAddRow, handleRemoveRow]);

  return (
    <DataTableContainer theme={theme} neon={neon}>
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
        />
      )}
      <MUIDataTable
        title=""
        data={data}
        columns={[...muiColumns, actionsColumn]}
        options={{
          search: false,
          filter: false,
          download: false,
          print: false,
          viewColumns: false,
          selectableRows: "none",
          pagination: false,
        }}
      />
    </DataTableContainer>
  );
}

export const DataTable = memo(DataTableComponent) as typeof DataTableComponent;