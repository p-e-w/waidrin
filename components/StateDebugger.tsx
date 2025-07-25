// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025  Philipp Emanuel Weidmann <pew@worldwidemann.com>

import { IconButton, Text, Tooltip, VisuallyHidden } from "@radix-ui/themes";
import dynamic from "next/dynamic";
import { Dialog } from "radix-ui";
import { useState } from "react";
import { GiAllSeeingEye } from "react-icons/gi";
import { RxCross2 } from "react-icons/rx";
import { useShallow } from "zustand/shallow";
import { type StoredState, useStateStore } from "@/lib/state";

// https://github.com/mac-s-g/react-json-view/issues/121#issuecomment-2578199942
const ReactJsonView = dynamic(() => import("@microlink/react-json-view"), { ssr: false });

export default function StateDebugger() {
  // We need to manually open the dialog using a custom event handler,
  // because the Tooltip component is incompatible with Dialog.Trigger.
  const [dialogOpen, setDialogOpen] = useState(false);

  const { state, setState } = useStateStore(
    useShallow((state) => ({
      state: state,
      setState: state.set,
    })),
  );

  // Remove properties containing functions to avoid corrupting them,
  // as functions cannot be edited and would be overwritten by garbage.
  const filteredState: Partial<StoredState> = { ...state };
  // delete filteredState.plugins;
  delete filteredState.backends;
  delete filteredState.set;
  delete filteredState.setAsync;

  return (
    <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen} modal={false}>
      <Tooltip
        content={
          <>
            <Text size="5">Open state debugger</Text>
            <br />
            <Text className="text-red-600" size="3" weight="bold">
              May contain spoilers!
            </Text>
          </>
        }
      >
        <IconButton onClick={() => setDialogOpen(true)} className="fixed top-3 right-3" variant="ghost" color="gray">
          <GiAllSeeingEye size="35" />
        </IconButton>
      </Tooltip>

      <Dialog.Portal>
        <Dialog.Content
          onPointerDownOutside={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
          className="fixed top-0 right-0 bottom-0 w-xs grid overflow-auto pl-1 border-l border-(--gold-10) bg-[rgb(30,30,30)]"
        >
          <VisuallyHidden>
            <Dialog.Title className="DialogTitle">State debugger</Dialog.Title>
          </VisuallyHidden>
          <ReactJsonView
            src={filteredState}
            name="state"
            theme="twilight"
            displayObjectSize={false}
            displayDataTypes={false}
            quotesOnKeys={false}
            enableClipboard={false}
            indentWidth={2}
            collapsed={1}
            collapseStringsAfterLength={100}
            onAdd={(edit) => setState(edit.updated_src)}
            onEdit={(edit) => setState(edit.updated_src)}
            onDelete={(edit) => setState(edit.updated_src)}
          />

          <Dialog.Close asChild>
            <IconButton className="fixed top-1 right-1" variant="ghost" aria-label="Close">
              <RxCross2 size="20" />
            </IconButton>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
