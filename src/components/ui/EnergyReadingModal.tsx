"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { createEnergyReading } from "@/lib/api";

const nowLocal = () => {
  const d = new Date();
  d.setSeconds(0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function EnergyReadingModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}) {
  const { toast } = useToast();
  const [electricity, setElectricity] = useState("");
  const [hvac, setHvac] = useState("");
  const [lighting, setLighting] = useState("");
  const [equipment, setEquipment] = useState("");
  const [water, setWater] = useState("");
  const [timestamp, setTimestamp] = useState(nowLocal());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const kwh = Number(electricity);
    if (!Number.isFinite(kwh) || kwh <= 0) {
      setError("Electricity (kWh) is required and must be greater than 0");
      return;
    }
    const parts = [hvac, lighting, equipment, water].map(Number);
    if (parts.some((v) => !Number.isFinite(v) || v < 0)) {
      setError("Split readings must be 0 or a positive number");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createEnergyReading({
        electricity_kwh: kwh,
        hvac_kwh: parts[0] || 0,
        lighting_kwh: parts[1] || 0,
        equipment_kwh: parts[2] || 0,
        water_l: parts[3] || 0,
        timestamp: timestamp ? new Date(timestamp).toISOString() : undefined,
      });
      toast("Energy reading recorded", "success");
      onCreated?.();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? `Failed to record reading (${e.message})` : "Failed to record reading");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Energy Reading"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={submitting}>Record reading</Button>
        </>
      }
    >
      <div key={open ? "open" : "closed"} className="grid grid-cols-1 gap-4">
        <TextField
          label="Electricity (kWh)"
          type="number"
          min={0}
          step="0.1"
          placeholder="420.5"
          hint="Total draw for this interval"
          value={electricity}
          onChange={(e) => setElectricity(e.target.value)}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <TextField label="HVAC (kWh)" type="number" min={0} step="0.1" placeholder="0" value={hvac} onChange={(e) => setHvac(e.target.value)} />
          <TextField label="Lighting (kWh)" type="number" min={0} step="0.1" placeholder="0" value={lighting} onChange={(e) => setLighting(e.target.value)} />
          <TextField label="Equipment (kWh)" type="number" min={0} step="0.1" placeholder="0" value={equipment} onChange={(e) => setEquipment(e.target.value)} />
        </div>
        <TextField label="Water (litres)" type="number" min={0} step="1" placeholder="0" value={water} onChange={(e) => setWater(e.target.value)} />
        <TextField label="Timestamp (optional)" type="datetime-local" value={timestamp} onChange={(e) => setTimestamp(e.target.value)} />
        {error && <p role="alert" className="font-caption text-caption text-alert-red">{error}</p>}
      </div>
    </Modal>
  );
}
