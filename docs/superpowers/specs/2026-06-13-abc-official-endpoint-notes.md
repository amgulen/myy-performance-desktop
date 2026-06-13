# ABC 官方接口确认记录

日期：2026-06-13

来源：[ABC 数字医疗云开放平台区域 2 文档](https://open-region2.abcyun.cn/)

本记录只收录 V1 最快可用路径需要的接口，不替代完整接口文档。后续字段映射、绩效原子数据转换和对账逻辑必须继续以官方文档与真实联调返回为准。

## 已确认 GET 接口

| V1 模块 | 官方摘要 | Method | Path | 关键查询参数 | 备注 |
|---|---|---:|---|---|---|
| 人员 | 获取门店人员列表 | GET | `/api/v2/open-agency/clinics/employees` | 无分页参数示例 | 返回 `data.employeeList` |
| 收费 | 查询指定日期的收费单 | GET | `/api/v2/open-agency/charge/query-by-date` | `date`, `limit`, `offset` | 返回 `data.chargeSheets`，用于先拿收费单摘要 |
| 收费明细 | 获取收费单明细 | GET | `/api/v2/open-agency/charge/query-detail/{id}` | Path `id` | 明细含 `receivableFee`, `receivedFee`, `refundFee`, `refundTime`, `doctor`, `sellerName`, `chargedTime` 等 |
| 门诊/处方 | 按天查询门诊单 | GET | `/api/v2/open-agency/outpatient/query-by-date` | `date`, `limit`, `offset` | 返回 `data.rows`，处方明细需再按详情/打印接口展开 |
| 检查检验 | 按时间查询检查检验单 | GET | `/api/v2/open-agency/examination/all/query-by-date` | `dateFieldType`, `startTime`, `endTime`, `limit`, `offset`, `type` | 返回 `data.rows` |
| 药房收费 | 查询指定日期的收费单 | GET | `/api/v2/open-agency/pharmacy/charge/query-by-date` | `date`, `limit`, `offset` | 可作为药品/药房绩效候选来源 |
| 药房收费明细 | 获取收费单明细 | GET | `/api/v2/open-agency/pharmacy/charge/query-detail/{id}` | Path `id` | 明细结构接近收费明细，并包含 `sellNo` |

## 当前实现绑定

- `STAFF` -> `/api/v2/open-agency/clinics/employees`
- `CHARGE` -> `/api/v2/open-agency/charge/query-by-date`
- `PRESCRIPTION` -> `/api/v2/open-agency/outpatient/query-by-date`
- `LAB` -> `/api/v2/open-agency/examination/all/query-by-date`
- `REFUND` -> `/api/v2/open-agency/charge/query-by-date`

`REFUND` 暂映射为收费单摘要查询，因为官方文档中“收费单退款”是 `PUT /api/v2/open-agency/charge/{chargeSheetId}/refund` 操作接口，不是退费列表查询接口。V1 退费同步应通过收费单摘要 + 收费明细中的 `refundFee`、`refundTime` 等字段构造冲减原子数据。

## 当前实现查询参数

- 人员：不追加查询参数。
- 收费/退费候选：`date={from}`, `limit=500`, `offset=0`。
- 门诊/处方候选：`date={from}`, `limit=100`, `offset=0`。
- 检查检验：`dateFieldType=1`, `startTime={from} 00:00:00`, `endTime={to} 23:59:59`, `limit=100`, `offset=0`。

## 下一步

1. 增加按收费单 ID 拉取收费明细的应用用例，把 `chargeSheets[].id` 展开为明细。
2. 按 `refundFee/refundTime/status` 生成可追溯冲减候选数据。
3. 对门诊/处方和检查检验继续抽取明细字段，映射为统一绩效原子数据。
4. 联调真实返回后，补充字段差异和容错映射，不在代码中写死业务绩效规则。
