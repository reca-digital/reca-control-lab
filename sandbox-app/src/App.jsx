import React, { useState } from "react";

const initial = [
  { id: 1042, name: "Ольга", items: "Раф × 1, круассан × 1", status: "Новый", time: "10:24" },
  { id: 1041, name: "Даниил", items: "Капучино × 2", status: "Готовится", time: "10:18" },
  { id: 1040, name: "Анна", items: "Латте × 1", status: "Готов", time: "10:12" }
];
const states = ["Новый", "Подтверждён", "Готовится", "Готов", "Выдан"];
export default function App() {
  const [orders, setOrders] = useState(initial);
  const [filter, setFilter] = useState("Все");
  const visible = filter === "Все" ? orders : orders.filter((o) => o.status === filter);
  function advance(id) {
    setOrders((previous) => previous.map((order) => order.id === id
      ? { ...order, status: states[Math.min(states.indexOf(order.status) + 1, states.length - 1)] }
      : order));
  }
  return (
    <main className="dashboard">
      <header className="heading">
        <div><p className="eyebrow">RECA Digital · Демонстрация</p><h1>Заказы кофейни «Маяк»</h1><p className="description">Тестовые заказы без сервера, оплаты и персональных данных настоящих гостей.</p></div>
        <span className="demo-pill">Демо-режим</span>
      </header>
      <section className="summary" aria-label="Статистика заказов">
        <div className="metric"><span>Всего заказов</span><strong>{orders.length}</strong></div>
        <div className="metric"><span>Ожидают подтверждения</span><strong>{orders.filter(o => o.status === "Новый").length}</strong></div>
        <div className="metric"><span>В работе</span><strong>{orders.filter(o => ["Подтверждён", "Готовится"].includes(o.status)).length}</strong></div>
      </section>
      <section className="orders" aria-label="Список заказов">
        <div className="section-heading"><h2>Текущие заказы</h2><label>Статус <select value={filter} onChange={e => setFilter(e.target.value)}><option>Все</option>{states.map(s => <option key={s}>{s}</option>)}</select></label></div>
        <div className="list">{visible.length === 0 ? <p className="empty">Заказов с таким статусом нет.</p> : visible.map(order =>
          <article className="order" key={order.id}>
            <div className="order-details"><p className="order-number">Заказ №{order.id} · {order.time}</p><h3>{order.name}</h3><p>{order.items}</p></div>
            <div className="actions"><span className="status">{order.status}</span><button type="button" disabled={order.status === "Выдан"} onClick={() => advance(order.id)}>{order.status === "Выдан" ? "Завершён" : "Следующий этап"}</button></div>
          </article>)}</div>
      </section>
      <footer>Демонстрационный интерфейс · данные хранятся только в памяти браузера.</footer>
    </main>
  );
}
