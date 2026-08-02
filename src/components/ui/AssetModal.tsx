"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { SelectField, TextField } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { createAsset, type AssetItem } from "@/lib/api";

const STATUSES = ["Excellent", "Good", "Warning", "Critical"];

const today = () => new Date().toISOString().slice(0, 10);

export function AssetModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: (a: AssetItem) => void;
}) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [assetType, setAssetType] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("Good");
  const [healthScore, setHealthScore] = useState("80");
  const [manufacturer, setManufacturer] = useState("");
  const [usefulLife, setUsefulLife] = useState("100");
  const [installDate, setInstallDate] = useState(today());
  const [lastMaintenance, setLastMaintenance] = useState(today());
  const [nextDue, setNextDue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!name.trim()) {
      setError("Asset name is required");
      return;
    }
    if (!assetType.trim()) {
      setError("Asset type is required");
      return;
    }
    if (!location.trim()) {
      setError("Location is required");
      return;
    }
    const score = Number(healthScore);
    const life = Number(usefulLife);
    if (!Number.isFinite(score) || score < 0 || score > 100) {
      setError("Health score must be between 0 and 100");
      return;
    }
    if (!Number.isFinite(life) || life < 0 || life > 100) {
      setError("Useful life % must be between 0 and 100");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const asset = await createAsset({
        name: name.trim(),
        asset_type: assetType.trim(),
        location: location.trim(),
        status,
        health_score: Math.round(score),
        manufacturer: manufacturer.trim() || "Unknown",
        useful_life_pct: life,
        install_date: installDate,
        last_maintenance: lastMaintenance,
        next_due: nextDue || null,
      });
      toast(`Asset ${asset.id} added`, "success");
      onCreated?.(asset);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? `Failed to add asset (${e.message})` : "Failed to add asset");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Asset"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={submitting}>Add asset</Button>
        </>
      }
    >
      <div key={open ? "open" : "closed"} className="grid grid-cols-1 gap-4">
        <TextField label="Asset name" placeholder="AHU-9" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField label="Asset type" placeholder="HVAC" value={assetType} onChange={(e) => setAssetType(e.target.value)} />
          <SelectField label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </SelectField>
        </div>
        <TextField label="Location" placeholder="Floor 3 Plant" value={location} onChange={(e) => setLocation(e.target.value)} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField label="Health score (0-100)" type="number" min={0} max={100} value={healthScore} onChange={(e) => setHealthScore(e.target.value)} />
          <TextField label="Useful life (%)" type="number" min={0} max={100} value={usefulLife} onChange={(e) => setUsefulLife(e.target.value)} />
        </div>
        <TextField label="Manufacturer" placeholder="Carrier" value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <TextField label="Install date" type="date" value={installDate} onChange={(e) => setInstallDate(e.target.value)} />
          <TextField label="Last maintenance" type="date" value={lastMaintenance} onChange={(e) => setLastMaintenance(e.target.value)} />
          <TextField label="Next due (optional)" type="date" value={nextDue} onChange={(e) => setNextDue(e.target.value)} />
        </div>
        {error && <p role="alert" className="font-caption text-caption text-alert-red">{error}</p>}
      </div>
    </Modal>
  );
}
