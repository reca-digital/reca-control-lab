import React, { useState } from "react";

const initial = [
  { id: 1042, name: "Ольга", items: "Раф × 1, круассан × 1", status: "Новый", time: "10:24" },
  { id: 1041, name: "Даниил", items: "Капучино × 2", status: "Готовится", time: "10:18" },
  { id: 1040, name: "Анна", items: "Латте × 1", status: "Готов", time: "10:12" }
];
const states = ["Новый", "Подтверждён", "Готовится", "Готов", "Выдан"];
const nextLabel = {
  "Новый": "Подтвердить заказ",
  "Подтверждён": "Начать приготовление",
  "Готовится": "Отметить готовым",
  "Готов": "Выдать заказ",
  "Выдан": "Завершён"
};
const statusClass = {
  "Новый": "new",
  "Подтверждён": "confirmed",
  "Готовится": "cooking",
  "Готов": "ready",
  "Выдан": "handed"
};
export default function App() {
  const [orders, setOrders] = useState(initial);
  const [filter, setFilter] = useState("Все");
  const pending = orders.filter(order => order.status === "Новый").length;
  const visible = (filter === "Все" ? orders : orders.filter(order => order.status === filter))
    .slice().sort((a,b) => (a.status === "Новый" ? 0 : 1) - (b.status === "Новый" ? 0 : 1) || b.id - a.id);
  function advance(id) {
    setOrders(previous => previous.map(order => order.id === id
      ? { ...order, status: states[Math.min(states.indexOf(order.status) + 1, states.length - 1)] }
      : order));
  }
  return (
    <main className="dashboard">
      <header className="heading">
        <div>
          <p className="eyebrow">RECA Digital · Демонстрация</p>
          <h1>Заказы кофейни «Маяк»</h1>
          <p className="description">Панель оператора. Все заказы и имена вымышленные; изменения не сохраняются после обновления.</p>
        </div>
        <span className="demo-pill">Демо-режим</span>
      </header>
      <section className="summary" aria-label="Статистика заказов">
        <div className="metric"><span>Всего заказов</span><strong>{orders.length}</strong></div>
        <div className={"metric " + (pending ? "metric-urgent" : "")}><span>Нужно подтвердить</span><strong>{pending}</strong></div>
        <div className="metric"><span>В работе</span><strong>{orders.filter(o => ["Подтверждён", "Готовится"].includes(o.status)).length}</strong></div>
      </section>
      {pending > 0 && <div className="priority-notice" role="status"><span aria-hidden="true">●</span><strong>Требуют внимания: {pending}</strong><span>Сначала подтвердите новые заказы.</span></div>}
      <section className="orders" aria-label="Список заказов">
        <div className="section-heading">
          <h2>Текущие заказы</h2>
          <label htmlFor="status-filter">Показать
            <select id="status-filter" value={filter} onChange={e => setFilter(e.target.value)}>
              <option>Все</option>{states.map(status => <option key={status}>{status}</option>)}
            </select>
          </label>
        </div>
        <div className="list" aria-live="polite">
          {visible.length === 0
            ? <p className="empty">Заказов с таким статусом нет. Выберите другой фильтр.</p>
            : visible.map(order =>
              <article className={"order order-" + statusClass[order.status]} key={order.id}>
                <div className="order-details">
                  <p className="order-number">Заказ №{order.id} · {order.time}</p>
                  <h3>{order.name}</h3>
                  <p className="order-items">{order.items}</p>
                </div>
                <div className="actions">
                  <span className={"status status-" + statusClass[order.status]}><span className="status-dot" aria-hidden="true"/> {order.status}</span>
                  <button type="button" disabled={order.status === "Выдан"} onClick={() => advance(order.id)} aria-label={nextLabel[order.status] + ", заказ номер " + order.id}>
                    {nextLabel[order.status]}
                  </button>
                </div>
              </article>)}
        </div>
      </section>
      <footer>Тестовая лаборатория · без настоящих заказов, платежей и сервера.</footer>
    </main>
  );
}
