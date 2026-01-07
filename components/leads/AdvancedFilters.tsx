"use client";

import { useState, useEffect } from "react";
import { Filter, X, ChevronDown, ChevronUp, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeadStatus, LeadSource, UserRole } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";

export interface FilterState {
  search: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  statuses: string[];
  sources: string[];
  assignedUsers: string[];
  createdFrom: string;
  createdTo: string;
  updatedFrom: string;
  updatedTo: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

interface AdvancedFiltersProps {
  userRole: string;
  users: Array<{ id: string; name: string; email: string }>;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onReset: () => void;
}

const defaultFilters: FilterState = {
  search: "",
  name: "",
  email: "",
  phone: "",
  address: "",
  statuses: [],
  sources: [],
  assignedUsers: [],
  createdFrom: "",
  createdTo: "",
  updatedFrom: "",
  updatedTo: "",
  sortBy: "createdAt",
  sortOrder: "desc",
};

export function AdvancedFilters({
  userRole,
  users,
  filters,
  onFiltersChange,
  onReset,
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [savedPresets, setSavedPresets] = useState<Array<{ name: string; filters: FilterState }>>([]);
  const [presetName, setPresetName] = useState("");

  const activeFilterCount =
    (filters.name ? 1 : 0) +
    (filters.email ? 1 : 0) +
    (filters.phone ? 1 : 0) +
    (filters.address ? 1 : 0) +
    filters.statuses.length +
    filters.sources.length +
    filters.assignedUsers.length +
    (filters.createdFrom ? 1 : 0) +
    (filters.createdTo ? 1 : 0) +
    (filters.updatedFrom ? 1 : 0) +
    (filters.updatedTo ? 1 : 0) +
    (filters.sortBy !== defaultFilters.sortBy ? 1 : 0);

  const updateFilter = (key: keyof FilterState, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleStatus = (status: string) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter((s) => s !== status)
      : [...filters.statuses, status];
    updateFilter("statuses", newStatuses);
  };

  const toggleSource = (source: string) => {
    const newSources = filters.sources.includes(source)
      ? filters.sources.filter((s) => s !== source)
      : [...filters.sources, source];
    updateFilter("sources", newSources);
  };

  const toggleAssignedUser = (userId: string) => {
    const newUsers = filters.assignedUsers.includes(userId)
      ? filters.assignedUsers.filter((u) => u !== userId)
      : [...filters.assignedUsers, userId];
    updateFilter("assignedUsers", newUsers);
  };

  const handleReset = () => {
    onReset();
    setIsOpen(false);
  };

  const savePreset = () => {
    if (!presetName.trim()) return;
    if (typeof window === "undefined") return;
    const newPresets = [...savedPresets, { name: presetName, filters: { ...filters } }];
    setSavedPresets(newPresets);
    localStorage.setItem("leadFilterPresets", JSON.stringify(newPresets));
    setPresetName("");
  };

  const loadPreset = (preset: { name: string; filters: FilterState }) => {
    onFiltersChange(preset.filters);
  };

  const deletePreset = (index: number) => {
    if (typeof window === "undefined") return;
    const newPresets = savedPresets.filter((_, i) => i !== index);
    setSavedPresets(newPresets);
    localStorage.setItem("leadFilterPresets", JSON.stringify(newPresets));
  };

  // Load presets on component mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("leadFilterPresets");
      if (stored) {
        try {
          setSavedPresets(JSON.parse(stored));
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Advanced Filters
          {activeFilterCount > 0 && (
            <Badge variant="default" className="ml-1">
              {activeFilterCount}
            </Badge>
          )}
          {isOpen ? (
            <ChevronUp className="h-4 w-4 ml-auto" />
          ) : (
            <ChevronDown className="h-4 w-4 ml-auto" />
          )}
        </Button>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {isOpen && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Advanced Search & Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Field-specific Search */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="filter-name">Name</Label>
                <Input
                  id="filter-name"
                  placeholder="Search by name..."
                  value={filters.name}
                  onChange={(e) => updateFilter("name", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="filter-email">Email</Label>
                <Input
                  id="filter-email"
                  type="email"
                  placeholder="Search by email..."
                  value={filters.email}
                  onChange={(e) => updateFilter("email", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="filter-phone">Phone</Label>
                <Input
                  id="filter-phone"
                  placeholder="Search by phone..."
                  value={filters.phone}
                  onChange={(e) => updateFilter("phone", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="filter-address">Address</Label>
                <Input
                  id="filter-address"
                  placeholder="Search by address..."
                  value={filters.address}
                  onChange={(e) => updateFilter("address", e.target.value)}
                />
              </div>
            </div>

            {/* Status Filter (Multiple Selection) */}
            <div>
              <Label>Status</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {Object.values(LeadStatus).map((status) => (
                  <Button
                    key={status}
                    variant={filters.statuses.includes(status) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleStatus(status)}
                    className="text-xs"
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ")}
                  </Button>
                ))}
              </div>
            </div>

            {/* Source Filter */}
            <div>
              <Label>Source</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {Object.values(LeadSource).map((source) => (
                  <Button
                    key={source}
                    variant={filters.sources.includes(source) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleSource(source)}
                    className="text-xs"
                  >
                    {source.charAt(0).toUpperCase() + source.slice(1).replace("-", " ")}
                  </Button>
                ))}
              </div>
            </div>

            {/* Assigned User Filter (Multiple Selection) */}
            {[UserRole.ADMIN, UserRole.MANAGER, UserRole.TEAM_LEADER].includes(userRole as UserRole) && (
              <div>
                <Label>Assigned To</Label>
                <div className="mt-2 max-h-32 overflow-y-auto border border-gray-200 dark:border-gray-800 rounded-md p-2">
                  {users.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No users available</p>
                  ) : (
                    <div className="space-y-1">
                      {users.map((user) => (
                        <label
                          key={user.id}
                          className="flex items-center gap-2 p-1 hover:bg-gray-50 dark:hover:bg-gray-800 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={filters.assignedUsers.includes(user.id)}
                            onChange={() => toggleAssignedUser(user.id)}
                            className="rounded border-gray-300 dark:border-gray-700"
                          />
                          <span className="text-sm">{user.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Date Range Filters */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Created Date Range</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <Label htmlFor="created-from" className="text-xs">
                      From
                    </Label>
                    <Input
                      id="created-from"
                      type="date"
                      value={filters.createdFrom}
                      onChange={(e) => updateFilter("createdFrom", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="created-to" className="text-xs">
                      To
                    </Label>
                    <Input
                      id="created-to"
                      type="date"
                      value={filters.createdTo}
                      onChange={(e) => updateFilter("createdTo", e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div>
                <Label>Updated Date Range</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <Label htmlFor="updated-from" className="text-xs">
                      From
                    </Label>
                    <Input
                      id="updated-from"
                      type="date"
                      value={filters.updatedFrom}
                      onChange={(e) => updateFilter("updatedFrom", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="updated-to" className="text-xs">
                      To
                    </Label>
                    <Input
                      id="updated-to"
                      type="date"
                      value={filters.updatedTo}
                      onChange={(e) => updateFilter("updatedTo", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sort Options */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="sort-by">Sort By</Label>
                <Select
                  id="sort-by"
                  value={filters.sortBy}
                  onChange={(e) => updateFilter("sortBy", e.target.value)}
                >
                  <option value="createdAt">Created Date</option>
                  <option value="updatedAt">Updated Date</option>
                  <option value="name">Name</option>
                  <option value="status">Status</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="sort-order">Order</Label>
                <Select
                  id="sort-order"
                  value={filters.sortOrder}
                  onChange={(e) => updateFilter("sortOrder", e.target.value as "asc" | "desc")}
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </Select>
              </div>
            </div>

            {/* Save/Load Presets */}
            <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
              <Label>Filter Presets</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Preset name..."
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  className="flex-1"
                />
                <Button size="sm" onClick={savePreset} disabled={!presetName.trim()}>
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
              </div>
              {savedPresets.length > 0 && (
                <div className="mt-3 space-y-1">
                  {savedPresets.map((preset, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded"
                    >
                      <button
                        onClick={() => loadPreset(preset)}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex-1 text-left"
                      >
                        {preset.name}
                      </button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deletePreset(index)}
                        className="h-6 w-6 p-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
