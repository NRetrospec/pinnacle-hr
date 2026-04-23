import { useState } from "react";
import {
  FileText,
  Search,
  Plus,
  CreditCard,
  User,
  FileCheck,
  Award,
  File,
  Eye,
  EyeOff,
  Trash2,
  Loader2,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Id } from "../../../convex/_generated/dataModel";

const categoryConfig = {
  bank_info: {
    label: "Bank Information",
    icon: CreditCard,
    color: "text-success",
    bgColor: "bg-success/10",
  },
  personal_info: {
    label: "Personal Information",
    icon: User,
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  tax_info: {
    label: "Tax Information",
    icon: FileCheck,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  contracts: {
    label: "Contracts",
    icon: FileText,
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  certifications: {
    label: "Certifications",
    icon: Award,
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  other: {
    label: "Other Documents",
    icon: File,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
  },
};

type CategoryType = keyof typeof categoryConfig;

const DocumentsPage = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showSensitive, setShowSensitive] = useState<Record<string, boolean>>({});
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");

  // Add document form state
  const [addEmployeeId, setAddEmployeeId] = useState("");
  const [addCategory, setAddCategory] = useState("");
  const [addTitle, setAddTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Fetch data
  const documents = useQuery(api.documents.list, {});
  const employees = useQuery(api.employees.list, {});
  const deleteDocument = useMutation(api.documents.remove);
  const createDocument = useMutation(api.documents.create);

  // Filter documents
  const filteredDocuments = documents?.filter((doc) => {
    const matchesSearch =
      searchTerm === "" ||
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.employee?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.employee?.lastName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" || doc.category === selectedCategory;

    const matchesEmployee =
      selectedEmployee === "all" || doc.employeeId === selectedEmployee;

    return matchesSearch && matchesCategory && matchesEmployee;
  });

  // Group documents by employee
  const documentsByEmployee = filteredDocuments?.reduce(
    (acc, doc) => {
      const empKey = doc.employeeId;
      if (!acc[empKey]) {
        acc[empKey] = {
          employee: doc.employee,
          documents: [],
        };
      }
      acc[empKey].documents.push(doc);
      return acc;
    },
    {} as Record<string, { employee: any; documents: typeof filteredDocuments }>
  );

  const toggleSensitive = (docId: string) => {
    setShowSensitive((prev) => ({
      ...prev,
      [docId]: !prev[docId],
    }));
  };

  const handleCreate = async () => {
    if (!addEmployeeId || !addCategory || !addTitle.trim()) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      await createDocument({
        employeeId: addEmployeeId as Id<"employees">,
        category: addCategory as "bank_info" | "personal_info" | "tax_info" | "contracts" | "certifications" | "other",
        title: addTitle.trim(),
        data: { fields: [] },
      });
      toast({
        title: "Document Added",
        description: "The document has been created successfully.",
      });
      setShowAddDialog(false);
      setAddEmployeeId("");
      setAddCategory("");
      setAddTitle("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create document.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: Id<"documents">) => {
    try {
      await deleteDocument({ id });
      toast({
        title: "Document Deleted",
        description: "The document has been removed successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete document.",
        variant: "destructive",
      });
    }
  };

  if (documents === undefined || employees === undefined) {
    return (
      <DashboardLayout role="admin">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              Documents
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage employee documents and records
            </p>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Document
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search documents or employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.entries(categoryConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Employees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {employees?.map((emp) => (
                    <SelectItem key={emp._id} value={emp._id}>
                      {emp.firstName} {emp.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Category Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Object.entries(categoryConfig).map(([key, config]) => {
            const count = documents?.filter((d) => d.category === key).length || 0;
            const Icon = config.icon;
            return (
              <Card
                key={key}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedCategory === key ? "ring-2 ring-primary" : ""
                }`}
                onClick={() =>
                  setSelectedCategory(selectedCategory === key ? "all" : key)
                }
              >
                <CardContent className="pt-4 pb-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${config.bgColor}`}>
                      <Icon className={`w-4 h-4 ${config.color}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{count}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {config.label}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Documents by Employee */}
        <Card>
          <CardHeader>
            <CardTitle>Employee Documents</CardTitle>
            <CardDescription>
              {filteredDocuments?.length || 0} documents found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!documentsByEmployee || Object.keys(documentsByEmployee).length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No documents found</p>
                <p className="text-sm">Add documents to get started</p>
              </div>
            ) : (
              <Accordion type="multiple" className="space-y-2">
                {Object.entries(documentsByEmployee).map(([empId, data]) => (
                  <AccordionItem
                    key={empId}
                    value={empId}
                    className="border rounded-lg px-4"
                  >
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                          <span className="font-semibold text-accent">
                            {data.employee?.firstName?.[0]}
                            {data.employee?.lastName?.[0]}
                          </span>
                        </div>
                        <div className="text-left">
                          <p className="font-medium">
                            {data.employee?.firstName} {data.employee?.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {data.employee?.department} -{" "}
                            {data.employee?.employeeNumber}
                          </p>
                        </div>
                        <Badge variant="secondary" className="ml-auto mr-4">
                          {data.documents?.length || 0} docs
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-4">
                        {data.documents?.map((doc) => {
                          const config =
                            categoryConfig[doc.category as CategoryType];
                          const Icon = config?.icon || File;

                          return (
                            <div
                              key={doc._id}
                              className="border rounded-lg p-4 space-y-3"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-lg ${config?.bgColor}`}>
                                    <Icon className={`w-4 h-4 ${config?.color}`} />
                                  </div>
                                  <div>
                                    <h4 className="font-medium">{doc.title}</h4>
                                    <p className="text-sm text-muted-foreground">
                                      {config?.label} • Updated{" "}
                                      {format(new Date(doc.updatedAt), "MMM d, yyyy")}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => toggleSensitive(doc._id)}
                                  >
                                    {showSensitive[doc._id] ? (
                                      <EyeOff className="w-4 h-4" />
                                    ) : (
                                      <Eye className="w-4 h-4" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => handleDelete(doc._id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>

                              {doc.description && (
                                <p className="text-sm text-muted-foreground">
                                  {doc.description}
                                </p>
                              )}

                              {doc.data?.fields && doc.data.fields.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                  {doc.data.fields.map((field, idx) => (
                                    <div key={idx} className="text-sm">
                                      <span className="text-muted-foreground">
                                        {field.label}:
                                      </span>
                                      <span className="ml-2 font-medium">
                                        {field.sensitive && !showSensitive[doc._id]
                                          ? "••••••••"
                                          : field.value}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Document Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => {
        setShowAddDialog(open);
        if (!open) {
          setAddEmployeeId("");
          setAddCategory("");
          setAddTitle("");
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Document</DialogTitle>
            <DialogDescription>
              Create a document record for an employee
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="add-employee">Employee *</Label>
              <Select value={addEmployeeId} onValueChange={setAddEmployeeId}>
                <SelectTrigger id="add-employee">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees?.map((emp) => (
                    <SelectItem key={emp._id} value={emp._id}>
                      {emp.firstName} {emp.lastName} — {emp.employeeNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-category">Category *</Label>
              <Select value={addCategory} onValueChange={setAddCategory}>
                <SelectTrigger id="add-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-title">Document Title *</Label>
              <Input
                id="add-title"
                placeholder="e.g., W-4 Form 2024"
                value={addTitle}
                onChange={(e) => setAddTitle(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={isCreating}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Document
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default DocumentsPage;
