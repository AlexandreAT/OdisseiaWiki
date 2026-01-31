import React, { useEffect, useState, memo, useCallback, useMemo } from "react";
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
  columns: ColumnConfig<T>[]; // 🔹 agora usado de verdade
  searchable?: boolean;
  searchPlaceholder?: string;
  searchData?: T[]; // lista de dados para buscar
  onSelectSearch?: (item: T) => void; // callback quando selecionar
  searchKeys?: (keyof T)[]; // campos do objeto que serão pesquisados
}

interface ColumnConfig<T> {
  key: keyof T;
  label: string;
  width?: string | number;
  inputType?: "text" | "number" | "select" | "checkselect"; // 🔹 novo tipo
  options?: { label: string; value: string }[]; // para select e checkselect
  customRender?: (value: any, row: T, onChange: (val: any) => void) => React.ReactNode;
}

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
  const [rows, setRows] = useState<T[]>(data);
  const [search, setSearch] = useState("");

  // Sincroniza quando a prop `data` mudar (útil)
  useEffect(() => {
    setRows(data);
  }, [data]);

  // 🔹 Atualiza célula
  const updateValue = useCallback((rowIndex: number, key: keyof T, value: any) => {
    setRows(prev => {
      const updated = [...prev];
      updated[rowIndex] = { ...updated[rowIndex], [key]: value };
      onChange(updated);
      return updated;
    });
  }, [onChange]);

  // 🔹 Renderiza célula baseado no tipo
  const renderCell = useCallback((col: ColumnConfig<T>, row: T, rowIndex: number) => {
    const value = row[col.key];

    if (col.customRender) {
      return col.customRender(value, row, (val) => updateValue(rowIndex, col.key, val));
    }

    switch (col.inputType) {
      case "number":
        return (
          <TextField
            type="number"
            fullWidth
            variant="standard"
            value={value || ""}
            onChange={(e) => updateValue(rowIndex, col.key, e.target.value === "" ? "" : Number(e.target.value))}
            //onChange={(e) => updateValue(rowIndex, col.key, e.target.value)}
          />
        );

      case "select":
        return (
          <Select
            theme={theme}
            neon={neon}
            label={col.label}
            value={value || ""}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateValue(rowIndex, col.key, e.target.value)}
            //onChange={(e) => updateValue(rowIndex, col.key, e.target.value)}
            options={col.options || []}
            width="100%"
          />
        );

      case "checkselect": // 🔹 novo tipo
        return (
          <CheckSelect
            theme={theme}
            neon={neon}
            label={col.label}
            options={col.options || []}
            value={Array.isArray(value) ? value : []} // garante que seja array
            onChange={(newValues: string[]) => updateValue(rowIndex, col.key, newValues)}
            width="100%"
          />
        );

      case "text":
      default:
        return (
          <TextField
            fullWidth
            variant="standard"
            value={value || ""}
            onChange={(e) => updateValue(rowIndex, col.key, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const inputs = document.querySelectorAll<HTMLInputElement>("input.MuiInputBase-input");
                const currentIndex = Array.from(inputs).indexOf(e.target as HTMLInputElement);
                if (currentIndex + 1 < inputs.length) {
                  inputs[currentIndex + 1].focus();
                } else {
                  handleAddRow();
                }
              }
            }}
          />
        );
    }
  }, [theme, neon, updateValue]);

  // 🔹 Colunas formatadas para MUIDataTable
  const muiColumns = useMemo(() => columns.map((col) => ({
    name: String(col.key),
    label: col.label,
    options: {
      customBodyRenderLite: (dataIndex: number) =>
        renderCell(col, rows[dataIndex], dataIndex),
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
  })), [columns, rows, renderCell]);

  const handleAddRow = useCallback(() => {
    const emptyRow = columns.reduce((acc, col) => {
      // preencha tipos base: number -> 0, text/select -> ""
      (acc as any)[col.key] = col.inputType === "number" ? 0 : "";
      return acc;
    }, {} as T);
    const updated = [...rows, emptyRow];
    setRows(updated);
    onChange(updated);
  }, [columns, rows, onChange]);

  const handleRemoveRow = useCallback((index: number) => {
    const updated = rows.filter((_, i) => i !== index);
    setRows(updated);
    onChange(updated);
  }, [rows, onChange]);

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
        data={rows}
        columns={[
          ...muiColumns,
          {
            name: "Ações",
            options: {
              filter: false,
              sort: false,
              customBodyRenderLite: (dataIndex: number) => {
                const isLastRow = dataIndex === rows.length - 1;
                return (
                  <IconButton
                    onClick={() =>
                      isLastRow ? handleAddRow() : handleRemoveRow(dataIndex)
                    }
                  >
                    {isLastRow ? (
                      <Add className="icon" />
                    ) : (
                      <Delete className="iconDelete" />
                    )}
                  </IconButton>
                );
              },
            },
          },
        ]}
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