import { useEffect, useState } from 'react';

function App() {
  const [message, setMessage] = useState('載入中');

  // 可以看到兩秒鐘後從「載入中」變化成後端回傳的文字
  useEffect(() => {
    setTimeout(() => {
      fetch('http://localhost:5100/api/hello')
      .then((res) => {
        return res.json()
      })
      .then((data) => {
        return setMessage(data.message)
      });
    }, 2000);
  }, []);

  return (
    <div>
      <h1>React + Express + TS</h1>
      <p>{message}</p>
    </div>
  );
}

export default App;
