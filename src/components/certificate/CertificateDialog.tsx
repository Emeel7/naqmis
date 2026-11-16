"use client";
import { Printer } from "lucide-react";
import type { EnrolmentView } from "@/lib/selectors";
import { fullName } from "@/lib/format";
import Overlay from "@/components/ui/Overlay";
import Button from "@/components/ui/Button";
import Certificate from "./Certificate";

/** Opens only for Graduated records that have a certificate number and graduation date (rule enforced here too). */
export default function CertificateDialog({ view, onClose }: { view: EnrolmentView | null; onClose: () => void }) {
  const eligible = !!view && view.lq.status === "Graduated" && !!view.lq.certificate_number && !!view.lq.graduation_date;
  return (
    <Overlay
      open={!!view} onClose={onClose} title="Graduation certificate (demo sample)" size="xl"
      footer={eligible ? <><Button variant="secondary" onClick={onClose}>Close</Button><Button icon={<Printer className="h-4 w-4" aria-hidden />} onClick={() => window.print()}>Print / save as PDF</Button></> : <Button variant="secondary" onClick={onClose}>Close</Button>}
    >
      {view && eligible ? (
        <Certificate
          learnerName={fullName(view.learner)} qualificationTitle={view.qualification.title} qabName={view.qab.name}
          levelName={view.level.level_name} certificateNumber={view.lq.certificate_number!} graduationDate={view.lq.graduation_date!}
        />
      ) : (
        <p className="text-sm text-slate-700">A certificate is only available once the record has the status <strong>Graduated</strong>.</p>
      )}
    </Overlay>
  );
}
