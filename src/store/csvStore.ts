import { create } from 'zustand';
import type { ColumnType, ColumnStats, SortConfig, CSVRow } from '../types/csv.types';

interface CSVState {
  // Raw data
  rawData: CSVRow[];
  headers: string[];
  fileName: string;
  totalRows: number;

  // Column metadata
  columnTypes: Record<string, ColumnType>;
  columnStats: Record<string, ColumnStats>;

  // Table state
  filteredData: CSVRow[];
  currentPage: number;
  pageSize: number;
  sortConfig: SortConfig | null;
  searchQuery: string;
  columnFilter: { column: string; value: string } | null;

  // Actions
  setData: (data: CSVRow[], headers: string[], fileName: string) => void;
  setColumnTypes: (types: Record<string, ColumnType>) => void;
  setColumnStats: (stats: Record<string, ColumnStats>) => void;
  setFilteredData: (data: CSVRow[]) => void;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSortConfig: (config: SortConfig | null) => void;
  setSearchQuery: (query: string) => void;
  setColumnFilter: (filter: { column: string; value: string } | null) => void;
  reset: () => void;
}

const initialState = {
  rawData: [],
  headers: [],
  fileName: '',
  totalRows: 0,
  columnTypes: {},
  columnStats: {},
  filteredData: [],
  currentPage: 1,
  pageSize: 25,
  sortConfig: null,
  searchQuery: '',
  columnFilter: null,
};

export const useCSVStore = create<CSVState>((set) => ({
  ...initialState,

  setData: (data, headers, fileName) =>
    set({ rawData: data, filteredData: data, headers, fileName, totalRows: data.length, currentPage: 1 }),

  setColumnTypes: (types) => set({ columnTypes: types }),
  setColumnStats: (stats) => set({ columnStats: stats }),
  setFilteredData: (data) => set({ filteredData: data, currentPage: 1 }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setPageSize: (size) => set({ pageSize: size, currentPage: 1 }),
  setSortConfig: (config) => set({ sortConfig: config }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setColumnFilter: (filter) => set({ columnFilter: filter }),
  reset: () => set(initialState),
}));
