"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "./ui/button";
import Typography from "./Typography";
import type { StoredFile } from "./Dropzone";

type ClearAllButtonProps = {
  fileStore: StoredFile[];
  processing: boolean;
  onClearAll: () => void;
};

const ClearAllButton = ({ fileStore, processing, onClearAll }: ClearAllButtonProps) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button className="type-fluid type-button px-2" disabled={fileStore.length <= 0 || processing} variant="link" onClick={() => setOpen(true)}>
        Clear all
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton={false} className="rounded-2xl border-2 border-foreground bg-background p-(--space-xl) shadow-xl">
          <DialogHeader className="items-start text-left gap-(--space-sm)">
            <DialogTitle className="leading-none"><Typography as="span" variant="label" weight={600}>Clear all files?</Typography></DialogTitle>
            <DialogDescription><Typography as="span" variant="bodySm" muted>Queued files, results, and comparison state will be removed from this tab.</Typography></DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-(--space-lg)">
            <Button className="border-2 border-foreground bg-background text-foreground hover:bg-muted" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="destructive" className="border-2 border-foreground text-white" onClick={() => { onClearAll(); setOpen(false); }}>Clear all</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ClearAllButton;
