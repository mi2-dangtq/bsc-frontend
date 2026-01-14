'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

export interface Department {
  id: string;
  name: string;
  code: string | null;
  primaryPerspectiveId: number | null;
  perspective?: {
    id: number;
    name: string;
    color: string | null;
  } | null;
}

interface DepartmentContextType {
  departments: Department[];
  selectedDepartment: Department | null;
  setSelectedDepartment: (dept: Department | null) => void;
  isCompanyView: boolean; // true = xem toàn công ty, false = xem phòng ban cụ thể
  loading: boolean;
}

const DepartmentContext = createContext<DepartmentContextType | null>(null);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const STORAGE_KEY = 'bsc-selected-department';
const COMPANY_DEPT_ID = '1'; // Mi2 JSC - cấp cao nhất với parentId = null

export function DepartmentProvider({ children }: { children: ReactNode }) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartmentState] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Fetch departments và restore selection từ localStorage
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await fetch(`${API_URL}/departments`);
        if (res.ok) {
          const data: Department[] = await res.json();
          setDepartments(data);
          
          // Restore từ localStorage sau khi có danh sách departments
          const savedId = localStorage.getItem(STORAGE_KEY);
          if (savedId) {
            const found = data.find(d => d.id === savedId);
            if (found) {
              setSelectedDepartmentState(found);
            }
          } else {
            // Mặc định chọn công ty (dept id='1') nếu chưa có selection
            const companyDept = data.find(d => d.id === COMPANY_DEPT_ID);
            if (companyDept) {
              setSelectedDepartmentState(companyDept);
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch departments:', err);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    fetchDepartments();
  }, []);

  // Wrapper để lưu vào localStorage khi chọn
  const setSelectedDepartment = useCallback((dept: Department | null) => {
    setSelectedDepartmentState(dept);
    if (dept) {
      localStorage.setItem(STORAGE_KEY, dept.id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // isCompanyView = đang xem cấp công ty (id='1')
  const isCompanyView = selectedDepartment?.id === COMPANY_DEPT_ID;

  return (
    <DepartmentContext.Provider
      value={{
        departments,
        selectedDepartment,
        setSelectedDepartment,
        isCompanyView,
        loading: loading || !initialized,
      }}
    >
      {children}
    </DepartmentContext.Provider>
  );
}

export function useDepartment() {
  const context = useContext(DepartmentContext);
  if (!context) {
    throw new Error('useDepartment must be used within DepartmentProvider');
  }
  return context;
}
