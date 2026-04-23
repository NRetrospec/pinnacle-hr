import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { EmployeeDialog } from "@/components/admin/EmployeeDialog";
import { EmployeeTable } from "@/components/admin/EmployeeTable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const EmployeesPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "active" | "inactive" | "terminated" | undefined
  >("active");
  const [departmentFilter, setDepartmentFilter] = useState<string | undefined>(
    undefined
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);

  // Fetch employees with filters
  const employees = useQuery(api.employees.list, {
    status: statusFilter,
    department: departmentFilter,
  });

  // Fetch departments for filter dropdown
  const departments = useQuery(api.employees.getDepartments);

  // Client-side search filtering
  const filteredEmployees = employees?.filter((emp) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      emp.firstName.toLowerCase().includes(searchLower) ||
      emp.lastName.toLowerCase().includes(searchLower) ||
      emp.email.toLowerCase().includes(searchLower) ||
      emp.employeeNumber.toLowerCase().includes(searchLower) ||
      emp.department.toLowerCase().includes(searchLower) ||
      emp.position.toLowerCase().includes(searchLower)
    );
  });

  const handleEdit = (employee: any) => {
    setEditingEmployee(employee);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingEmployee(null);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingEmployee(null);
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              Employees
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage employee profiles and information
            </p>
          </div>
          <Button onClick={handleCreate} size="lg">
            <Plus className="w-4 h-4 mr-2" />
            Add Employee
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search employees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Department Filter */}
          <Select
            value={departmentFilter || "all"}
            onValueChange={(value) =>
              setDepartmentFilter(value === "all" ? undefined : value)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments?.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <div className="flex gap-2">
            <Button
              variant={statusFilter === "active" ? "default" : "outline"}
              onClick={() => setStatusFilter("active")}
              size="sm"
            >
              Active
            </Button>
            <Button
              variant={statusFilter === "inactive" ? "default" : "outline"}
              onClick={() => setStatusFilter("inactive")}
              size="sm"
            >
              Inactive
            </Button>
            <Button
              variant={statusFilter === undefined ? "default" : "outline"}
              onClick={() => setStatusFilter(undefined)}
              size="sm"
            >
              All
            </Button>
          </div>
        </div>

        {/* Results Count */}
        {filteredEmployees && (
          <div className="text-sm text-muted-foreground">
            Showing {filteredEmployees.length} of {employees?.length || 0}{" "}
            employees
          </div>
        )}

        {/* Table */}
        {!employees ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : filteredEmployees?.length === 0 ? (
          <div className="dashboard-card p-12 text-center">
            <p className="text-muted-foreground">No employees found</p>
            <Button onClick={handleCreate} className="mt-4">
              <Plus className="w-4 h-4 mr-2" />
              Add First Employee
            </Button>
          </div>
        ) : (
          <EmployeeTable employees={filteredEmployees || []} onEdit={handleEdit} />
        )}

        {/* Dialog */}
        <EmployeeDialog
          open={isDialogOpen}
          onOpenChange={handleDialogClose}
          employee={editingEmployee}
        />
      </div>
    </DashboardLayout>
  );
};

export default EmployeesPage;
