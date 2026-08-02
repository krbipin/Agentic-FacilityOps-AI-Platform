"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { SelectField, TextField } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { createFacility, type FacilityItem } from "@/lib/api";

const FACILITY_TYPES = [
  "Corporate HQ",
  "IT Park",
  "Office",
  "Hospital",
  "University",
  "Data Center",
  "Manufacturing Plant",
  "Warehouse",
  "Retail",
  "Other",
];

export function FacilityModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: (f: FacilityItem) => void;
}) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [type, setType] = useState(FACILITY_TYPES[0]);
  const [customType, setCustomType] = useState("");
  const [location, setLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const facilityType = type === "Other" ? customType : type;

  const submit = async () => {
    if (!name.trim()) {
      setError("Facility name is required");
      return;
    }
    if (!facilityType.trim()) {
      setError("Facility type is required");
      return;
    }
    if (!location.trim()) {
      setError("Location is required");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const f = await createFacility({ name: name.trim(), facility_type: facilityType.trim(), location: location.trim() });
      toast(`Facility "${f.name}" created and set active`, "success");
      onCreated?.(f);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? `Failed to create facility (${e.message})` : "Failed to create facility");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Facility"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={submitting}>Create facility</Button>
        </>
      }
    >
      <div key={open ? "open" : "closed"} className="grid grid-cols-1 gap-4">
        <TextField label="Facility name" placeholder="Skyline Tower" value={name} onChange={(e) => setName(e.target.value)} />
        <SelectField label="Facility type" value={type} onChange={(e) => setType(e.target.value)}>
          {FACILITY_TYPES.map((t) => <option key={t}>{t}</option>)}
        </SelectField>
        {type === "Other" && (
          <TextField label="Facility type (custom)" placeholder="e.g. Airport" value={customType} onChange={(e) => setCustomType(e.target.value)} />
        )}
        <TextField label="Location" placeholder="City, Country" value={location} onChange={(e) => setLocation(e.target.value)} />
        <p className="font-caption text-caption text-steel-slate">
          New facilities start empty — add assets and energy readings to populate the dashboards.
        </p>
        {error && <p role="alert" className="font-caption text-caption text-alert-red">{error}</p>}
      </div>
    </Modal>
  );
}
