import {useEffect} from "react";
import {useMoralis} from "react-moralis";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  NavLink,
  Redirect,
} from "react-router-dom";
import Account from "components/Account";
import Chains from "components/Chains";
import TokenPrice from "components/TokenPrice";
import ERC20Balance from "components/ERC20Balance";
import ERC20Transfers from "components/ERC20Transfers";
import InchDex from "components/InchDex";
import NFTBalance from "components/NFTBalance";
import Wallet from "components/Wallet";
import {Menu, Layout, Tabs} from "antd";
import "antd/dist/antd.css";
import NativeBalance from "components/NativeBalance";
import "./style.css";
import Contract from "components/Contract/Contract";
import Text from "antd/lib/typography/Text";
import Ramper from "components/Ramper";
import ScalableRng from "./components/ScalableRng/ScalableRng";

const {Header, Footer} = Layout;

const styles = {
  content: {
    display: "flex",
    justifyContent: "center",
    fontFamily: "Roboto, sans-serif",
    color: "#041836",
    marginTop: "130px",
    padding: "10px",
  },
  header: {
    position: "fixed",
    zIndex: 1,
    width: "100%",
    background: "#fff",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontFamily: "Roboto, sans-serif",
    borderBottom: "2px solid rgba(0, 0, 0, 0.06)",
    padding: "0 10px",
    boxShadow: "0 1px 10px rgb(151 164 175 / 10%)",
  },
  headerRight: {
    display: "flex",
    gap: "20px",
    alignItems: "center",
    fontSize: "15px",
    fontWeight: "600",
  },
};
const App = ({isServerInfo}) => {
  const {isWeb3Enabled, enableWeb3, isAuthenticated, isWeb3EnableLoading} =
    useMoralis();

  useEffect(() => {
    if (isAuthenticated && !isWeb3Enabled && !isWeb3EnableLoading) enableWeb3();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isWeb3Enabled]);

  return (
    <Layout style={{height: "100vh", overflow: "auto"}}>
      <Router>
        <Header style={styles.header}>
          <Menu
            theme="light"
            mode="horizontal"
            style={{
              display: "flex",
              fontSize: "17px",
              fontWeight: "500",
              width: "100%",
              justifyContent: "center",
            }}
            defaultSelectedKeys={["scalablerng"]}
          >
            <Menu.Item key="scalablerng">
              <NavLink to="/scalablerng">🚀 Scalable RNG</NavLink>
            </Menu.Item>
            <Menu.Item key="contract">
              <NavLink to="/contract">📄 Contract</NavLink>
            </Menu.Item>
          </Menu>
          <div style={styles.headerRight}>
            <Chains/>
            <Account/>
          </div>
        </Header>
        <div style={styles.content}>
          <Switch>
            <Route path="/scalablerng">
              <ScalableRng/>
            </Route>
            <Route path="/wallet">
              <Wallet/>
            </Route>
            <Route path="/1inch">
              <Tabs defaultActiveKey="1" style={{alignItems: "center"}}>
                <Tabs.TabPane tab={<span>Ethereum</span>} key="1">
                  <InchDex chain="eth"/>
                </Tabs.TabPane>
                <Tabs.TabPane tab={<span>Binance Smart Chain</span>} key="2">
                  <InchDex chain="bsc"/>
                </Tabs.TabPane>
                <Tabs.TabPane tab={<span>Polygon</span>} key="3">
                  <InchDex chain="polygon"/>
                </Tabs.TabPane>
              </Tabs>
            </Route>
            <Route path="/erc20balance">
              <ERC20Balance/>
            </Route>
            <Route path="/onramp">
              <Ramper/>
            </Route>
            <Route path="/erc20transfers">
              <ERC20Transfers/>
            </Route>
            <Route path="/nftBalance">
              <NFTBalance/>
            </Route>
            <Route path="/contract">
              <Contract/>
            </Route>
            <Route path="/nonauthenticated">
              <>Please login using the "Authenticate" button</>
            </Route>
          </Switch>
          <Redirect to="/scalablerng"/>
        </div>
      </Router>
      <Footer style={{textAlign: "center"}}>
        <Text style={{display: "block"}}>
          This demo was made using the Moralis
          {" "}
          <a
            href="https://github.com/ethereum-boilerplate/ethereum-boilerplate/"
            target="_blank"
            rel="noopener noreferrer"
          >
            boilerplate
          </a>. Please star this!
        </Text>

        <Text style={{display: "block"}}>
          🙋 You have questions? Ask them on the {""}
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://forum.moralis.io/t/ethereum-boilerplate-questions/3951/29"
          >
            Moralis forum
          </a>
        </Text>

        <Text style={{display: "block"}}>
          📖 Read more about{" "}
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://moralis.io?utm_source=boilerplatehosted&utm_medium=todo&utm_campaign=ethereum-boilerplat"
          >
            Moralis
          </a>
        </Text>
      </Footer>
    </Layout>
  );
};

export default App;
