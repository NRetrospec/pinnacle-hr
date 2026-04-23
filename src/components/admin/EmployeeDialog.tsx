import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const employeeSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  department: z.string().min(1, "Department is required"),
  position: z.string().min(1, "Position is required"),
  payRate: z.number().min(0, "Pay rate must be positive"),
  payType: z.enum(["hourly", "salary"]),
  hireDate: z.string().min(1, "Hire date is required"),
  ptoAccrualRate: z.number().min(0, "PTO accrual rate must be positive"),
  ptoCap: z.number().min(0, "PTO cap must be positive"),
  status: z.enum(["active", "inactive", "terminated"]).optional(),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface EmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: any;
}

export function EmployeeDialog({
  open,
  onOpenChange,
  employee,
}: EmployeeDialogProps) {
  const { toast } = useToast();
  const createEmployee = useMutation(api.employees.create);
  const updateEmployee = useMutation(api.employees.update);
  const nextEmployeeNumber = useQuery(api.employees.generateEmployeeNumber);

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      department: "",
      position: "",
      payRate: 0,
      payType: "hourly",
      hireDate: new Date().toISOString().split("T")[0],
      ptoAccrualRate: 3.08, // Default: ~80 hours/year ÷ 26 pay periods
      ptoCap: 120,
      status: "active",
    },
  });

  // Reset form when employee changes or dialog opens
  useEffect(() => {
    if (employee) {
      form.reset({
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        phone: employee.phone || "",
        department: employee.department,
        position: employee.position,
        payRate: employee.payRate,
        payType: employee.payType,
        hireDate: new Date(employee.hireDate).toISOString().split("T")[0],
        ptoAccrualRate: employee.ptoAccrualRate,
        ptoCap: employee.ptoCap,
        status: employee.status,
      });
    } else {
      form.reset({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        department: "",
        position: "",
        payRate: 0,
        payType: "hourly",
        hireDate: new Date().toISOString().split("T")[0],
        ptoAccrualRate: 3.08,
        ptoCap: 120,
        status: "active",
      });
    }
  }, [employee, form, open]);

  const onSubmit = async (data: EmployeeFormData) => {
    try {
      if (employee) {
        // Update existing employee - include status for updates
        const updatePayload = {
          ...data,
          hireDate: new Date(data.hireDate).getTime(),
          payRate: Number(data.payRate),
          ptoAccrualRate: Number(data.ptoAccrualRate),
          ptoCap: Number(data.ptoCap),
        };
        await updateEmployee({
          id: employee._id,
          ...updatePayload,
        });
        toast({
          title: "Employee updated",
          description: `${data.firstName} ${data.lastName} has been updated successfully.`,
        });
      } else {
        // Create new employee - exclude status as backend sets it automatically
        if (!nextEmployeeNumber) {
          throw new Error("Could not generate employee number");
        }
        // Destructure to exclude status since backend sets it automatically to "active"
        const { status, ...createData } = data;
        const createPayload = {
          ...createData,
          hireDate: new Date(data.hireDate).getTime(),
          payRate: Number(data.payRate),
          ptoAccrualRate: Number(data.ptoAccrualRate),
          ptoCap: Number(data.ptoCap),
          employeeNumber: nextEmployeeNumber,
        };
        await createEmployee(createPayload);
        toast({
          title: "Employee created",
          description: `${data.firstName} ${data.lastName} has been added successfully.`,
        });
      }

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {employee ? "Edit Employee" : "Add New Employee"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-sm font-medium mb-3">Personal Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="john.doe@company.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="(555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Employment Information */}
            <div>
              <h3 className="text-sm font-medium mb-3">
                Employment Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department *</FormLabel>
                      <FormControl>
                        <Input placeholder="Engineering" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position *</FormLabel>
                      <FormControl>
                        <Input placeholder="Software Engineer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hireDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hire Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {employee && (
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="terminated">
                              Terminated
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>

            {/* Compensation */}
            <div>
              <h3 className="text-sm font-medium mb-3">Compensation</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="payType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pay Type *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="salary">Salary</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="payRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pay Rate ($) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="25.00"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        {form.watch("payType") === "hourly"
                          ? "Per hour"
                          : "Annual salary"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* PTO Settings */}
            <div>
              <h3 className="text-sm font-medium mb-3">PTO Settings</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="ptoAccrualRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Accrual Rate (hrs/period) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="3.08"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Hours accrued per pay period
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ptoCap"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PTO Cap (hours) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="1"
                          placeholder="120"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormDescription>Maximum PTO hours</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {employee ? "Update" : "Create"} Employee
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
