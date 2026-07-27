"use client";

import {
  ArrowDown,
  ArrowUp,
  Grid2X2,
  Plus,
  Trash2,
  X,
} from "lucide-react";

export type ProductSpecificationValue = {
  title: string;
  headers: string[];
  rows: string[][];
};

type ProductSpecificationEditorProps = {
  value: ProductSpecificationValue | null;
  onChange: (
    value: ProductSpecificationValue | null,
  ) => void;
  maxColumns?: number;
  maxRows?: number;
};

function normalizeRows(
  rows: string[][],
  columnCount: number,
): string[][] {
  return rows.map((row) => {
    const normalizedRow = [
      ...row.slice(0, columnCount),
    ];

    while (
      normalizedRow.length <
      columnCount
    ) {
      normalizedRow.push("");
    }

    return normalizedRow;
  });
}

function createDefaultSpecification(): ProductSpecificationValue {
  return {
    title: "规格参数",
    headers: ["参数", "说明"],
    rows: [],
  };
}

export default function ProductSpecificationEditor({
  value,
  onChange,
  maxColumns = 10,
  maxRows = 100,
}: ProductSpecificationEditorProps) {
  function enableSpecification() {
    onChange(
      createDefaultSpecification(),
    );
  }

  function disableSpecification() {
    onChange(null);
  }

  function updateTitle(
    title: string,
  ) {
    if (!value) {
      return;
    }

    onChange({
      ...value,
      title,
    });
  }

  function updateHeader(
    columnIndex: number,
    header: string,
  ) {
    if (!value) {
      return;
    }

    onChange({
      ...value,

      headers: value.headers.map(
        (item, index) =>
          index === columnIndex
            ? header
            : item,
      ),
    });
  }

  function addColumn() {
    if (
      !value ||
      value.headers.length >=
        maxColumns
    ) {
      return;
    }

    const nextHeaders = [
      ...value.headers,
      "",
    ];

    onChange({
      ...value,
      headers: nextHeaders,
      rows: normalizeRows(
        value.rows,
        nextHeaders.length,
      ),
    });
  }

  function removeColumn(
    columnIndex: number,
  ) {
    if (
      !value ||
      value.headers.length <= 1
    ) {
      return;
    }

    const nextHeaders =
      value.headers.filter(
        (_header, index) =>
          index !== columnIndex,
      );

    const nextRows =
      value.rows.map((row) =>
        row.filter(
          (_cell, index) =>
            index !== columnIndex,
        ),
      );

    onChange({
      ...value,
      headers: nextHeaders,
      rows: normalizeRows(
        nextRows,
        nextHeaders.length,
      ),
    });
  }

  function addRow() {
    if (
      !value ||
      value.rows.length >= maxRows
    ) {
      return;
    }

    onChange({
      ...value,

      rows: [
        ...value.rows,
        Array.from(
          {
            length:
              value.headers.length,
          },
          () => "",
        ),
      ],
    });
  }

  function removeRow(
    rowIndex: number,
  ) {
    if (!value) {
      return;
    }

    onChange({
      ...value,

      rows: value.rows.filter(
        (_row, index) =>
          index !== rowIndex,
      ),
    });
  }

  function updateCell(
    rowIndex: number,
    columnIndex: number,
    cellValue: string,
  ) {
    if (!value) {
      return;
    }

    const nextRows =
      normalizeRows(
        value.rows,
        value.headers.length,
      ).map((row, index) => {
        if (index !== rowIndex) {
          return row;
        }

        return row.map(
          (cell, cellIndex) =>
            cellIndex === columnIndex
              ? cellValue
              : cell,
        );
      });

    onChange({
      ...value,
      rows: nextRows,
    });
  }

  function moveRow(
    rowIndex: number,
    direction: -1 | 1,
  ) {
    if (!value) {
      return;
    }

    const nextIndex =
      rowIndex + direction;

    if (
      nextIndex < 0 ||
      nextIndex >= value.rows.length
    ) {
      return;
    }

    const nextRows = [
      ...value.rows,
    ];

    [
      nextRows[rowIndex],
      nextRows[nextIndex],
    ] = [
      nextRows[nextIndex],
      nextRows[rowIndex],
    ];

    onChange({
      ...value,
      rows: nextRows,
    });
  }

  if (!value) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white">
        <div className="flex min-h-48 flex-col items-center justify-center px-6 py-8 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <Grid2X2 className="h-7 w-7" />
          </span>

          <h3 className="mt-4 text-sm font-semibold text-slate-800">
            暂未启用规格参数表
          </h3>

          <p className="mt-1 max-w-md text-xs leading-5 text-slate-500">
            启用后可以设置表格标题、表头和多行产品规格数据。
          </p>

          <button
            type="button"
            onClick={enableSpecification}
            className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            启用规格表
          </button>
        </div>
      </section>
    );
  }

  const normalizedRows =
    normalizeRows(
      value.rows,
      value.headers.length,
    );

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <header className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Grid2X2 className="h-4 w-4 text-blue-600" />

            <h3 className="text-sm font-semibold text-slate-900">
              产品规格参数
            </h3>
          </div>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            配置前台产品详情页展示的规格表格。
          </p>
        </div>

        <button
          type="button"
          onClick={disableSpecification}
          className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-600 transition hover:bg-red-100"
        >
          <X className="h-3.5 w-3.5" />
          移除规格表
        </button>
      </header>

      <div className="space-y-6 p-5">
        <div>
          <label
            htmlFor="specificationTitle"
            className="text-sm font-semibold text-slate-700"
          >
            规格表标题
          </label>

          <input
            id="specificationTitle"
            value={value.title}
            maxLength={200}
            onChange={(event) =>
              updateTitle(
                event.target.value,
              )
            }
            placeholder="例如：技术规格"
            className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h4 className="text-sm font-semibold text-slate-800">
                表头
              </h4>

              <p className="mt-1 text-xs text-slate-500">
                当前共{" "}
                {value.headers.length} 列，最多{" "}
                {maxColumns} 列。
              </p>
            </div>

            <button
              type="button"
              onClick={addColumn}
              disabled={
                value.headers.length >=
                maxColumns
              }
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" />
              添加一列
            </button>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {value.headers.map(
              (header, columnIndex) => (
                <div
                  key={`header-${columnIndex}`}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-bold text-slate-500 shadow-sm ring-1 ring-slate-200">
                      {columnIndex + 1}
                    </span>

                    <input
                      value={header}
                      maxLength={100}
                      onChange={(
                        event,
                      ) =>
                        updateHeader(
                          columnIndex,
                          event.target
                            .value,
                        )
                      }
                      placeholder={`第 ${
                        columnIndex + 1
                      } 列名称`}
                      className="h-10 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        removeColumn(
                          columnIndex,
                        )
                      }
                      disabled={
                        value.headers
                          .length <= 1
                      }
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                      aria-label={`删除第 ${
                        columnIndex + 1
                      } 列`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>

        <div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h4 className="text-sm font-semibold text-slate-800">
                规格数据
              </h4>

              <p className="mt-1 text-xs text-slate-500">
                当前共{" "}
                {normalizedRows.length} 行，最多{" "}
                {maxRows} 行。
              </p>
            </div>

            <button
              type="button"
              onClick={addRow}
              disabled={
                normalizedRows.length >=
                maxRows
              }
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" />
              添加一行
            </button>
          </div>

          {normalizedRows.length === 0 ? (
            <div className="mt-3 flex min-h-32 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 text-center">
              <p className="text-sm font-medium text-slate-500">
                暂无规格数据
              </p>

              <button
                type="button"
                onClick={addRow}
                className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg bg-slate-950 px-3 text-xs font-semibold text-white transition hover:bg-slate-800"
              >
                <Plus className="h-3.5 w-3.5" />
                添加第一行
              </button>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {normalizedRows.map(
                (row, rowIndex) => (
                  <article
                    key={`row-${rowIndex}`}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-bold text-slate-500 shadow-sm ring-1 ring-slate-200">
                        {rowIndex + 1}
                      </span>

                      <div
                        className="grid min-w-0 flex-1 gap-3"
                        style={{
                          gridTemplateColumns:
                            `repeat(${Math.min(
                              value.headers
                                .length,
                              3,
                            )}, minmax(0, 1fr))`,
                        }}
                      >
                        {row.map(
                          (
                            cell,
                            columnIndex,
                          ) => (
                            <div
                              key={`cell-${rowIndex}-${columnIndex}`}
                            >
                              <label className="mb-1 block truncate text-xs font-medium text-slate-500">
                                {value.headers[
                                  columnIndex
                                ] ||
                                  `第 ${
                                    columnIndex +
                                    1
                                  } 列`}
                              </label>

                              <textarea
                                value={cell}
                                rows={2}
                                maxLength={1000}
                                onChange={(
                                  event,
                                ) =>
                                  updateCell(
                                    rowIndex,
                                    columnIndex,
                                    event
                                      .target
                                      .value,
                                  )
                                }
                                placeholder="请输入规格内容"
                                className="min-h-20 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm leading-5 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                              />
                            </div>
                          ),
                        )}
                      </div>

                      <div className="flex shrink-0 flex-col gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            moveRow(
                              rowIndex,
                              -1,
                            )
                          }
                          disabled={
                            rowIndex === 0
                          }
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-500 ring-1 ring-slate-200 transition hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30"
                          aria-label={`上移第 ${
                            rowIndex + 1
                          } 行`}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            moveRow(
                              rowIndex,
                              1,
                            )
                          }
                          disabled={
                            rowIndex ===
                            normalizedRows.length -
                              1
                          }
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-500 ring-1 ring-slate-200 transition hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30"
                          aria-label={`下移第 ${
                            rowIndex + 1
                          } 行`}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            removeRow(
                              rowIndex,
                            )
                          }
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white text-red-500 ring-1 ring-red-200 transition hover:bg-red-50 hover:text-red-700"
                          aria-label={`删除第 ${
                            rowIndex + 1
                          } 行`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </article>
                ),
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}