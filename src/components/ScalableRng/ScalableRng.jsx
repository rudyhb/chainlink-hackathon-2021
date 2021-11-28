import {Button, Card, Input, Form} from "antd";
import contractInfo from "contracts/contractInfo.json";
import Address from "components/Address/Address";
import {useMoralis} from "react-moralis";
import {useState, useEffect} from "react";
import useLocalStorage from "../../hooks/useLocalStorage";
import Loading from "../Loading";
import sha1 from 'sha1';
import {FaTimesCircle, FaExclamationTriangle} from "react-icons/fa";

const createRng = (rngSeed, salt) => {
  return sha1(JSON.stringify({
    salt,
    rngSeed
  }));
}

function RngRequestDisplay({
                             index,
                             salt,
                             committedIndex,
                             rng: rngSeed,
                             remove
                           }) {
  const loading = !rngSeed;
  const rng = rngSeed && salt && createRng(rngSeed, salt);
  return <Card
    title={`RNG Request ${index + 1}`}
    size="small"
    style={{marginBottom: "20px"}}
  >
    <div style={{
      position: "absolute",
      right: "20px",
      cursor: "pointer"
    }
    } onClick={() => remove(index)}>
      <FaTimesCircle size={25}/>
    </div>
    <p>salt: {salt}</p>
    <p>committedIndex: {committedIndex}</p>
    {loading && <p><Loading text='waiting for ChainLink Keepers to issue new RNG seed (takes ~30 sec)'/></p>}
    {rng && <p style={{
      fontWeight: "bold"
    }}>RNG: {rng}</p>}
  </Card>
}

function RngRequestInput({
                           index,
                           salt,
                           onSubmit
                         }) {

  const loading = !!salt;
  salt = salt || (Math.random() * 100_000).toFixed(0);
  return <Card
    title={`RNG Request ${index + 1}`}
    size="small"
    style={{marginBottom: "20px"}}
  >
    <Form layout="vertical" name={index} onFinish={onSubmit}>
      <Form.Item
        name='requestId'
        style={{display: "none"}}
        initialValue={index}
      >
        <Input type='hidden'/>
      </Form.Item>
      <Form.Item
        label={`salt`}
        name={`salt`}
        required
        initialValue={salt}
        style={{marginBottom: "15px"}}
      >
        <Input disabled={loading}/>
      </Form.Item>
      <Form.Item style={{marginBottom: "5px"}}>
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
        >
          {"Commit to next RNG💸"}
        </Button>
      </Form.Item>
    </Form>
  </Card>
}

export default function ScalableRng() {
  const {Moralis} = useMoralis();
  const {contractName, networks, abi} = contractInfo;
  const contractAddress = networks[80001].address;

  const [requests, setRequests] = useLocalStorage('rngRequests', [{}], true);

  const [connected, setConnected] = useState(true);
  console.log('connected: ', connected)

  const removeRequest = requestIndex => {
    setRequests(req => {
      req[requestIndex] = null;
      return req.slice(0);
    })
  }

  useEffect(() => {
    console.log('new requests', requests)
    const lastRequest = requests.filter(r => r).slice(-1)[0];
    if (!lastRequest || lastRequest.salt) {
      setRequests(req =>
        req.concat([{}])
      )
      return;
    }

    const pendingCommitRequests = requests.filter(r => r && r.salt && !r.committedIndex);

    if (pendingCommitRequests.length) {
      let cancel = false;
      const commitRequest = async request => {
        const options = {
          contractAddress,
          functionName: "commitToNextRng",
          abi,
          params: {},
        };
        try {
          const committedIndex = await Moralis.executeFunction({awaitReceipt: true, ...options});
          setConnected(true);
          request.committedIndex = committedIndex;
        } catch (e) {
          if (e && /make sure to call/i.test(e.message)) {
            setConnected(false);
          }
        }
      }
      // for some reason need to wait a few seconds before using Moralis
      (new Promise(resolve => {
        window.setTimeout(() => resolve(), 2000)
      })).then(() =>
        Promise.all(pendingCommitRequests.map(req => commitRequest(req)))
          .then(() => {
            if (!cancel)
              setRequests(requests.slice(0));
          }));
      return () => {
        cancel = true;
      }
    }

    let pendingKeepersRequests = requests.filter(r => r && r.committedIndex && !r.rng);

    if (pendingKeepersRequests.length) {
      let cancel = false;
      let anyChange = false;
      let anyMissing = false;
      const rngRequest = async request => {
        const options = {
          contractAddress,
          functionName: "tryRetrieveRng",
          abi,
          params: {index: request.committedIndex},
        };
        let result;
        try {
          result = await Moralis.executeFunction({awaitReceipt: true, ...options});
          setConnected(true);
        } catch (e) {
          result = {};
          if (e && /make sure to call/i.test(e.message)) {
            setConnected(false);
          }
        }
        const success = result[0];
        const rng = result[1];
        if (!success) {
          anyMissing = true;
          return;
        }
        anyChange = true;
        request.rng = rng;
      }
      // for some reason need to wait a few seconds before using Moralis
      const run = () => {
        window.setTimeout(() => {
          if (cancel) return;
          Promise.all(pendingKeepersRequests.map(req => rngRequest(req)))
            .then(() => {
              if (cancel) return;
              if (anyChange)
                setRequests(requests.slice(0));
              if (anyMissing) {
                pendingKeepersRequests = requests.filter(r => r && r.committedIndex && !r.rng);
                run();
              }
            });
        }, 3000);
      }
      run();
      return () => {
        cancel = true;
      }
    }

  }, [Moralis, abi, contractAddress, requests, setRequests]);

  function onFormFinish({salt, requestId}) {
    console.log('form finished', {salt, requestId});
    setRequests(req => {
      req[requestId].salt = salt;
      return req.slice(0);
    })
  }

  return (
    <div style={{margin: "auto", display: "flex", gap: "20px", marginTop: "25", width: "70vw"}}>
      <Card
        title={
          <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
            {contractName}
            <Address avatar="left" copyable address={contractAddress} size={8}/>
          </div>
        }
        size="large"
        style={{
          width: "100%",
          boxShadow: "0 0.5rem 1.2rem rgb(189 197 209 / 20%)",
          border: "1px solid #e7eaf3",
          borderRadius: "0.5rem",
        }}
      >
        {!connected && (<Card
          title={`Not connected!`}
          size="medium"
          style={{marginBottom: "20px"}}
        >
          <div style={{
            position: "absolute",
            right: "20px"
          }}>
            <FaExclamationTriangle size={25} color='gold'/>
          </div>
          <p>For the best experience make sure to connect on the top
            right corner.</p>
        </Card>)}
        {/*<Form.Provider*/}
        {/*  onFormFinish={async (name, {forms}) => {*/}
        {/*    console.log('forms', forms)*/}
        {/*    console.log('name', name)*/}
        {/*    const params = forms[name].getFieldsValue();*/}

        {/*    console.log('params', params)*/}

        {/*    setRequests(req => {*/}
        {/*      req[name].salt = params.salt;*/}
        {/*      return req;*/}
        {/*    });*/}
        {/*  }}*/}
        {/*>*/}
        {requests.map((req, i) => (
          !req ? null : <div
            key={i}
          >
            {req.committedIndex ?
              <RngRequestDisplay index={i} salt={req.salt} committedIndex={req.committedIndex} rng={req.rng}
                                 remove={removeRequest}/> :
              <RngRequestInput onSubmit={onFormFinish} index={i} salt={req.salt}/>}
          </div>
        ))}
        {/*{displayedContractFunctions &&*/}
        {/*displayedContractFunctions.map((item, key) => (*/}
        {/*  <Card*/}
        {/*    title={`${key + 1}. ${item?.name}`}*/}
        {/*    size="small"*/}
        {/*    style={{marginBottom: "20px"}}*/}
        {/*  >*/}
        {/*    <Form layout="vertical" name={`${item.name}`}>*/}
        {/*      {item.inputs.map((input, key) => (*/}
        {/*        <Form.Item*/}
        {/*          label={`${input.name} (${input.type})`}*/}
        {/*          name={`${input.name}`}*/}
        {/*          required*/}
        {/*          style={{marginBottom: "15px"}}*/}
        {/*        >*/}
        {/*          <Input placeholder="input placeholder"/>*/}
        {/*        </Form.Item>*/}
        {/*      ))}*/}
        {/*      <Form.Item style={{marginBottom: "5px"}}>*/}
        {/*        <Text style={{display: "block"}}>*/}
        {/*          {responses[item.name]?.result &&*/}
        {/*          `Response: ${JSON.stringify(responses[item.name]?.result)}`}*/}
        {/*        </Text>*/}
        {/*        <Button*/}
        {/*          type="primary"*/}
        {/*          htmlType="submit"*/}
        {/*          loading={responses[item?.name]?.isLoading}*/}
        {/*        >*/}
        {/*          {item.stateMutability === "view" ? "Read🔎" : "Transact💸"}*/}
        {/*        </Button>*/}
        {/*      </Form.Item>*/}
        {/*    </Form>*/}
        {/*  </Card>*/}
        {/*))}*/}
        {/*</Form.Provider>*/}
      </Card>
      {/*<Card*/}
      {/*  title={"Contract Events"}*/}
      {/*  size="large"*/}
      {/*  style={{*/}
      {/*    width: "40%",*/}
      {/*    boxShadow: "0 0.5rem 1.2rem rgb(189 197 209 / 20%)",*/}
      {/*    border: "1px solid #e7eaf3",*/}
      {/*    borderRadius: "0.5rem",*/}
      {/*  }}*/}
      {/*>*/}
      {/*  {data.map((event, key) => (*/}
      {/*    <Card title={"Transfer event"} size="small" style={{marginBottom: "20px"}}>*/}
      {/*      {getEllipsisTxt(event.attributes.transaction_hash, 14)}*/}
      {/*    </Card>*/}
      {/*  ))}*/}
      {/*</Card>*/}
    </div>
  );
}
