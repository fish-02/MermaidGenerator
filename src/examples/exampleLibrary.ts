export interface DiagramExample {
  id: string
  title: string
  category: string
  description: string
  /** Whether this diagram type has a canvas (React Flow) representation — spec §10.3 capability labeling. */
  canvasEditable: boolean
  code: string
}

export const EXAMPLE_LIBRARY: DiagramExample[] = [
  {
    id: 'basic-flowchart',
    title: '基本流程圖',
    category: '流程圖',
    description: '從開始到結束的線性作業流程。',
    canvasEditable: true,
    code: `flowchart TD
start([開始])
input[輸入資料]
process(處理資料)
finish([結束])
start --> input
input --> process
process --> finish`,
  },
  {
    id: 'decision-flow',
    title: '判斷流程',
    category: '流程圖',
    description: '含條件分支與回圈的資料驗證流程。',
    canvasEditable: true,
    code: `flowchart TD
start([開始])
input[輸入資料]
decision{資料是否正確？}
fix[修正資料]
save[(寫入資料庫)]
finish([結束])
start --> input
input --> decision
decision -->|是| save
decision -->|否| fix
fix --> input
save --> finish`,
  },
  {
    id: 'swimlane-flow',
    title: '泳道概念流程',
    category: '流程圖',
    description: '用群組表示不同角色／部門負責的步驟。',
    canvasEditable: true,
    code: `flowchart LR
subgraph lane1[使用者]
  submit[提交申請]
end
subgraph lane2[系統]
  validate{驗證資料}
  notify[發送通知]
end
subgraph lane3[審核人員]
  review[人工審核]
end
submit --> validate
validate -->|通過| notify
validate -->|不通過| review
review --> notify`,
  },
  {
    id: 'system-architecture',
    title: '系統架構',
    category: '流程圖',
    description: '前端、閘道與後端服務之間的請求流向。',
    canvasEditable: true,
    code: `flowchart TD
client[前端應用]
gateway(API 閘道)
auth{驗證通過？}
service1[訂單服務]
service2[使用者服務]
db[(資料庫)]
client --> gateway
gateway --> auth
auth -->|是| service1
auth -->|是| service2
auth -->|否| client
service1 --> db
service2 --> db`,
  },
  {
    id: 'user-journey',
    title: '使用者旅程',
    category: '使用者旅程',
    description: '從瀏覽到售後的體驗評分旅程圖。',
    canvasEditable: false,
    code: `journey
    title 使用者購物旅程
    section 瀏覽
      瀏覽商品: 5: 使用者
      搜尋商品: 3: 使用者
    section 購買
      加入購物車: 4: 使用者
      結帳付款: 2: 使用者
    section 售後
      收到商品: 5: 使用者
      撰寫評價: 4: 使用者`,
  },
  {
    id: 'state-transition',
    title: '狀態轉換',
    category: '狀態圖',
    description: '訂單處理的狀態機，含重試與結束狀態。',
    canvasEditable: false,
    code: `stateDiagram-v2
    [*] --> 待處理
    待處理 --> 處理中: 開始處理
    處理中 --> 已完成: 處理成功
    處理中 --> 失敗: 處理失敗
    失敗 --> 待處理: 重試
    已完成 --> [*]`,
  },
  {
    id: 'sequence-diagram',
    title: '序列圖',
    category: '序列圖',
    description: '使用者送出表單到後端回應的呼叫順序。',
    canvasEditable: false,
    code: `sequenceDiagram
    participant U as 使用者
    participant F as 前端
    participant B as 後端
    participant D as 資料庫
    U->>F: 送出表單
    F->>B: 呼叫 API
    B->>D: 查詢資料
    D-->>B: 回傳結果
    B-->>F: 回應資料
    F-->>U: 顯示結果`,
  },
  {
    id: 'class-diagram',
    title: '類別圖',
    category: '類別圖',
    description: '動物類別與兩個子類別的繼承關係。',
    canvasEditable: false,
    code: `classDiagram
    class Animal {
      +String name
      +int age
      +makeSound()
    }
    class Dog {
      +bark()
    }
    class Cat {
      +meow()
    }
    Animal <|-- Dog
    Animal <|-- Cat`,
  },
  {
    id: 'er-diagram',
    title: 'ER 圖',
    category: 'ER 圖',
    description: '客戶、訂單與商品之間的關聯資料模型。',
    canvasEditable: false,
    code: `erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ ORDER_ITEM : contains
    PRODUCT ||--o{ ORDER_ITEM : "included in"
    CUSTOMER {
      string name
      string email
    }
    ORDER {
      string id
      date createdAt
    }`,
  },
  {
    id: 'git-branch',
    title: 'Git 分支圖',
    category: 'Git 分支圖',
    description: '功能分支開發後合併回主線的提交歷史。',
    canvasEditable: false,
    code: `gitGraph
    commit id: "初始化"
    branch feature
    checkout feature
    commit id: "開發功能 A"
    commit id: "開發功能 B"
    checkout main
    commit id: "修復緊急問題"
    merge feature
    commit id: "發布 v1.0"`,
  },
]
