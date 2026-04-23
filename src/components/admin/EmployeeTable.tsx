import { format } from "date-fns";
import { Edit, Mail, Phone, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useToast } from "@/hooks/use-toast";
import { Id } from "../../../convex/_generated/dataModel";

interface EmployeeTableProps {
  employees: any[];
  onEdit: (employee: any) => void;
}

export function EmployeeTable({ employees, onEdit }: EmployeeTableProps) {
  const { toast } = useToast();
  const removeEmployee = useMutation(api.employees.remove);

  const handleDelete = async (employeeId: Id<"employees">, name: string) => {
    try {
      await removeEmployee({ id: employeeId });
      toast({
        title: "Employee terminated",
        description: `${name} has been marked as terminated.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "inactive":
        return "secondary";
      case "terminated":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <div className="dashboard-card overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="text-left text-sm text-muted-foreground border-b border-border">
              <th className="pb-3 pl-6 font-medium">Employee</th>
              <th className="pb-3 font-medium">Number</th>
              <th className="pb-3 font-medium">Department</th>
              <th className="pb-3 font-medium">Position</th>
              <th className="pb-3 font-medium">Hire Date</th>
              <th className="pb-3 font-medium">Pay Rate</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 pr-6 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr
                key={employee._id}
                className="border-b border-border/50 hover:bg-muted/50 transition-colors"
              >
                <td className="py-4 pl-6">
                  <div>
                    <div className="font-medium text-foreground">
                      {employee.firstName} {employee.lastName}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <Mail className="w-3 h-3" />
                      {employee.email}
                    </div>
                    {employee.phone && (
                      <div className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />
                        {employee.phone}
                      </div>
                    )}
                  </div>
                </td>
                <td className="py-4 text-foreground font-mono text-sm">
                  {employee.employeeNumber}
                </td>
                <td className="py-4 text-foreground">{employee.department}</td>
                <td className="py-4 text-foreground">{employee.position}</td>
                <td className="py-4 text-foreground">
                  {format(new Date(employee.hireDate), "MMM d, yyyy")}
                </td>
                <td className="py-4 text-foreground">
                  <div className="flex flex-col">
                    <span className="font-medium">
                      ${employee.payRate.toFixed(2)}
                    </span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {employee.payType}
                    </span>
                  </div>
                </td>
                <td className="py-4">
                  <Badge variant={getStatusVariant(employee.status) as any}>
                    {employee.status}
                  </Badge>
                </td>
                <td className="py-4 pr-6">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(employee)}
                      aria-label={`Edit ${employee.firstName} ${employee.lastName}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    {employee.status !== "terminated" && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" aria-label={`Terminate ${employee.firstName} ${employee.lastName}`}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Terminate Employee?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will mark {employee.firstName}{" "}
                              {employee.lastName} as terminated. This action can
                              be reversed by editing the employee status.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                handleDelete(
                                  employee._id,
                                  `${employee.firstName} ${employee.lastName}`
                                )
                              }
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Terminate
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List */}
      <div className="md:hidden divide-y divide-border">
        {employees.map((employee) => (
          <div key={employee._id} className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground">
                  {employee.firstName} {employee.lastName}
                </div>
                <div className="text-sm text-muted-foreground font-mono">
                  {employee.employeeNumber}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {employee.position} · {employee.department}
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Mail className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{employee.email}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Badge variant={getStatusVariant(employee.status) as any} className="text-xs">
                  {employee.status}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                ${employee.payRate.toFixed(2)}{" "}
                <span className="capitalize">{employee.payType}</span>
              </span>
              <span className="text-muted-foreground">
                Hired {format(new Date(employee.hireDate), "MMM d, yyyy")}
              </span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onEdit(employee)}
              >
                <Edit className="w-3.5 h-3.5 mr-1.5" />
                Edit
              </Button>
              {employee.status !== "terminated" && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                      Terminate
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Terminate Employee?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will mark {employee.firstName}{" "}
                        {employee.lastName} as terminated. This action can
                        be reversed by editing the employee status.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() =>
                          handleDelete(
                            employee._id,
                            `${employee.firstName} ${employee.lastName}`
                          )
                        }
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Terminate
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {employees.length === 0 && (
        <div className="p-12 text-center text-muted-foreground">
          No employees to display
        </div>
      )}
    </div>
  );
}
