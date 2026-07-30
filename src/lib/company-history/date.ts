import { ApiError } from "@/lib/api/errors";

const dateInputPattern = /^\d{4}-\d{2}-\d{2}$/;

export function parseDateInputToUtcNoon(value: string | Date): Date {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new ApiError("VALIDATION_ERROR", "排序时间格式不正确", 400, {
        sortDate: ["排序时间格式不正确"],
      });
    }

    return new Date(
      Date.UTC(
        value.getUTCFullYear(),
        value.getUTCMonth(),
        value.getUTCDate(),
        12,
        0,
        0,
        0,
      ),
    );
  }

  if (!dateInputPattern.test(value)) {
    throw new ApiError("VALIDATION_ERROR", "排序时间格式不正确", 400, {
      sortDate: ["请选择有效的排序时间"],
    });
  }

  const [yearText, monthText, dayText] = value.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new ApiError("VALIDATION_ERROR", "排序时间格式不正确", 400, {
      sortDate: ["请选择有效的排序时间"],
    });
  }

  return date;
}

export function formatDateInput(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}
