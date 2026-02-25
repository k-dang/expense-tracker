"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { CalendarIcon, Plus } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { CategoryFieldPicker } from "@/components/transactions/category-field-picker";
import { formatIsoDate, formatDateLabel } from "@/lib/date/utils";
import {
  createTransactionAction,
  type CreateTransactionState,
} from "@/lib/actions/transactions";

type Props = {
  categories: string[];
};

export function AddTransactionDialog({ categories }: Props) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, pending] = useActionState<
    CreateTransactionState,
    FormData
  >(createTransactionAction, null);

  useEffect(() => {
    if (state?.status === "success") {
      setOpen(false);
      setCategory("");
      setDate(new Date());
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setCategory("");
          setDate(new Date());
        }
      }}
    >
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => setOpen(true)}
      >
        <Plus className="size-4" />
        Add
      </Button>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add expense</DialogTitle>
        </DialogHeader>

        <form ref={formRef} action={formAction} className="grid gap-4">
          <Field>
            <FieldLabel>Date</FieldLabel>
            <input type="hidden" name="date" value={formatIsoDate(date)} />
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger
                render={
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  />
                }
              >
                <CalendarIcon className="mr-2 size-4" />
                {formatDateLabel(date)}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => {
                    if (d) {
                      setDate(d);
                      setCalendarOpen(false);
                    }
                  }}
                  defaultMonth={date}
                />
              </PopoverContent>
            </Popover>
            {state?.errors?.date && (
              <FieldError>{state.errors.date}</FieldError>
            )}
          </Field>

          <Field>
            <FieldLabel>Description</FieldLabel>
            <Input
              type="text"
              name="description"
              placeholder="e.g., Coffee at Tim Hortons"
              required
            />
            {state?.errors?.description && (
              <FieldError>{state.errors.description}</FieldError>
            )}
          </Field>

          <Field>
            <FieldLabel>Amount</FieldLabel>
            <InputGroup>
              <InputGroupAddon>
                <InputGroupText>$</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                type="number"
                name="amount"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                required
              />
            </InputGroup>
            {state?.errors?.amount && (
              <FieldError>{state.errors.amount}</FieldError>
            )}
          </Field>

          <Field>
            <FieldLabel>Category</FieldLabel>
            <input type="hidden" name="category" value={category} />
            <CategoryFieldPicker
              categories={categories}
              value={category}
              onValueChange={setCategory}
            />
            {state?.errors?.category && (
              <FieldError>{state.errors.category}</FieldError>
            )}
          </Field>

          <DialogFooter>
            <DialogClose
              render={<Button variant="outline" disabled={pending} />}
            >
              Cancel
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? "Adding..." : "Add Expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
