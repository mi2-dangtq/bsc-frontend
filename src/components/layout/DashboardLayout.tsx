'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Map,
  Target,
  BarChart3,
  Settings,
  Users,
  Building2,
  GitFork,
  ChevronDown,
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';

// Navigation items cho BSC/KPI System
const navigationItems = [
  {
    title: 'Tổng quan',
    url: '/',
    icon: LayoutDashboard,
  },
  {
    title: 'Chiến lược',
    icon: Map,
    items: [
      { title: 'Bản đồ chiến lược', url: '/strategy-map' },
      { title: 'Mục tiêu', url: '/objectives' },
      { title: 'Phân rã CSF', url: '/csf' },
    ],
  },
  {
    title: 'KPI',
    icon: Target,
    items: [
      { title: 'Thư viện KPI', url: '/kpi/library' },
      { title: 'Phân bổ KPI', url: '/kpi/allocation' },
      { title: 'Nhập kết quả', url: '/kpi/measurement' },
    ],
  },
  {
    title: 'Báo cáo',
    icon: BarChart3,
    items: [
      { title: 'Scorecard tổng hợp', url: '/scorecard' },
      { title: 'Theo phương diện', url: '/reports/perspective' },
      { title: 'Theo phòng ban', url: '/reports/department' },
    ],
  },
];

const managementItems = [
  {
    title: 'Phòng ban',
    url: '/departments',
    icon: Building2,
  },
  {
    title: 'Người dùng',
    url: '/users',
    icon: Users,
  },
  {
    title: 'Cài đặt',
    url: '/settings',
    icon: Settings,
  },
];

function AppSidebarContent() {
  const pathname = usePathname();

  return (
    <>
      <SidebarHeader className="border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GitFork className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">BSC/KPI</span>
            <span className="text-xs text-muted-foreground">Mi2 JSC</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu chính</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) =>
                item.items ? (
                  <Collapsible key={item.title} defaultOpen className="group/collapsible">
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                          <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.url}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={pathname === subItem.url}
                              >
                                <Link href={subItem.url}>{subItem.title}</Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                ) : (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={pathname === item.url}>
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="my-2" />

        <SidebarGroup>
          <SidebarGroupLabel>Quản lý</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {managementItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
            <Users className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">Admin</span>
            <span className="text-xs text-muted-foreground">admin@company.com</span>
          </div>
        </div>
      </SidebarFooter>
    </>
  );
}

export function AppSidebar() {
  return (
    <Sidebar>
      <AppSidebarContent />
    </Sidebar>
  );
}

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DepartmentProvider, useDepartment } from '@/contexts';

function DepartmentSelector() {
  const { departments, selectedDepartment, setSelectedDepartment, loading } = useDepartment();

  const handleChange = (value: string) => {
    const dept = departments.find((d) => d.id === value);
    if (dept) setSelectedDepartment(dept);
  };

  return (
    <Select
      value={selectedDepartment?.id || ''}
      onValueChange={handleChange}
      disabled={loading}
    >
      <SelectTrigger className="w-[200px]">
        <Building2 className="h-4 w-4 mr-2" />
        <SelectValue placeholder="Chọn phòng ban" />
      </SelectTrigger>
      <SelectContent>
        {departments.map((dept) => (
          <SelectItem key={dept.id} value={dept.id}>
            <span className="flex items-center gap-2">
              {dept.code && <span className="text-muted-foreground">[{dept.code}]</span>}
              {dept.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const { selectedDepartment, isCompanyView } = useDepartment();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b bg-background px-6">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-6" />
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Hệ thống BSC/KPI</h1>
          </div>
          <DepartmentSelector />
          {!isCompanyView && selectedDepartment && (
            <div className="text-sm text-muted-foreground">
              Đang xem: <span className="font-medium text-foreground">{selectedDepartment.name}</span>
            </div>
          )}
        </header>
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DepartmentProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </DepartmentProvider>
  );
}
