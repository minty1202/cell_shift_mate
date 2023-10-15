import { ShiftSchedulePage } from '@/pages/ShiftSchedulePage'

import { ConfigProvider, Layout } from 'antd';
import { geekblue, gray } from '@ant-design/colors';



import locale from 'antd/lib/locale/ja_JP';
import dayjs from 'dayjs';
import 'dayjs/locale/ja';


import 'normalize.css';
// import 'antd/dist/antd.css';
dayjs.locale('ja');

function App() {
  const { Header, Footer, Content } = Layout;

  return (
    <>
      <ConfigProvider locale={locale}>
        <Layout
          style={{
            background: geekblue[0],
            minHeight: '100vh'
          }}
        >
          <Header
            style={{
              background: '#fff',
              padding: '0 24px',
              display: 'flex',
              justifyContent: 'flex-start',
              alignItems: 'center',
              fontWeight: 'bold',
              fontSize: 24,
              color: geekblue[4],
            }}
          >
            Cell Shift Mate
          </Header>
          <Content
            style={{
              margin: '24px 16px',
              flex: 1,
              // background: '#fff',
              overflow: 'auto',
              
            }}
          >
            <ShiftSchedulePage />
          </Content>
          <Footer
            style={{
              background: geekblue[0],
              textAlign: 'center',
              color: gray[0],
            }}
          >
            Footer
          </Footer>
        </Layout>
      </ConfigProvider>
    </>
  )
}

export default App
