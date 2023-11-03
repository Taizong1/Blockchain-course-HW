import {Button, Image, Card, Divider, InputNumber} from 'antd';
// import {Header} from "../asset";
import {UserOutlined} from "@ant-design/icons";
import {useEffect, useState} from 'react';
import {borrowContract, web3} from "../utils/contracts";
import './index.css';
import moment from 'moment';

const GanacheTestChainId = '0x539' // Ganache默认的ChainId = 0x539 = Hex(1337)
// TODO change according to your configuration
const GanacheTestChainName = 'Ganache Test Chain'
const GanacheTestChainRpcUrl = 'http://127.0.0.1:8545'
const {Meta}=Card;

const BorrowPage = () => {

    const [account,setAccount] = useState('')
    const [CarList, setCarList] = useState([])
    const [MyBorrowList, setMyBorrowList] = useState([])
    const [UnBorrowList, setUnBorrowList] = useState([])
    const [DisplayCarList,setDisplayCarList]=useState(false)
    const [DisplayUnborrowCarList,setDisplayUnborrowCarList]=useState(false)
    const [SelectCar,setSelectCar]=useState(-1)
    const [CarOwner,setCarOwner]=useState('')
    const [CarBorrower,setBorrower]=useState('')
    const [CarBorrowUnitl,setCarBorrowUntil]=useState(0)
    const [BorrowTime,setBorrowTime]=useState(1)
    const [Update,setUpdate]=useState(0)

    useEffect(()=>{
        const initCheckAccounts = async () => {
            // @ts-ignore
            const {ethereum} = window;
            if (Boolean(ethereum && ethereum.isMetaMask)) {
                // 尝试获取连接的用户账户
                const accounts = await web3.eth.getAccounts()
                if(accounts && accounts.length) {
                    setAccount(accounts[0])
                }
            }
        }
        initCheckAccounts()
    },[])

    useEffect(() => {
        const getBorrowYourCarContractInfo = async () => {
            if (borrowContract) {
                const car_list = await borrowContract.methods.MyCarList().call({from: account})
                setCarList(car_list)
                const unborrow_car_list = await borrowContract.methods.UnBorrowCarList().call()
                setUnBorrowList(unborrow_car_list)
                const my_borrow_list = await borrowContract.methods.MyborrowedCarList().call({from: account})
                setMyBorrowList(my_borrow_list)
            } else {
                alert('Contract not exists.')
            }
        }
        if(account !== '') {
            getBorrowYourCarContractInfo()
            console.log(CarList[1])
        }
    }, [account])

    useEffect(() => {
        const getBorrowYourCarContractInfo = async () => {
            if (borrowContract) {
                const car_list = await borrowContract.methods.MyCarList().call({from: account})
                setCarList(car_list)
                const unborrow_car_list = await borrowContract.methods.UnBorrowCarList().call()
                setUnBorrowList(unborrow_car_list)
                const my_borrow_list = await borrowContract.methods.MyborrowedCarList().call({from: account})
                setMyBorrowList(my_borrow_list)
                setUpdate(0)
            } else {
                alert('Contract not exists.')
            }
        }
        if(account !== '') {
            getBorrowYourCarContractInfo()
            console.log(CarList[1])
        }
    }, [Update])
    
    function Initialization(){
        setSelectCar(-1)
        setCarOwner('')
        setBorrower('')
        setCarBorrowUntil(0)
    }

    const onClickConnectWallet = async () => {
        // 查看window对象里是否存在ethereum（metamask安装后注入的）对象
        // @ts-ignore
        const {ethereum} = window;
        if (!Boolean(ethereum && ethereum.isMetaMask)) {
            alert('MetaMask is not installed!');
            return
        }

        try {
            // 如果当前小狐狸不在本地链上，切换Metamask到本地测试链
            if (ethereum.chainId !== GanacheTestChainId) {
                const chain = {
                    chainId: GanacheTestChainId, // Chain-ID
                    chainName: GanacheTestChainName, // Chain-Name
                    rpcUrls: [GanacheTestChainRpcUrl], // RPC-URL
                };

                try {
                    // 尝试切换到本地网络
                    await ethereum.request({method: "wallet_switchEthereumChain", params: [{chainId: chain.chainId}]})
                } catch (switchError: any) {
                    // 如果本地网络没有添加到Metamask中，添加该网络
                    if (switchError.code === 4902) {
                        await ethereum.request({ method: 'wallet_addEthereumChain', params: [chain]
                        });
                    }
                }
            }

            // 小狐狸成功切换网络了，接下来让小狐狸请求用户的授权
            await ethereum.request({method: 'eth_requestAccounts'});
            // 获取小狐狸拿到的授权用户列表
            const accounts = await ethereum.request({method: 'eth_accounts'});
            // 如果用户存在，展示其account，否则显示错误信息
            setAccount(accounts[0] || 'Not able to get accounts');
        } catch (error: any) {
            alert(error.message)
        }
    }

    const onInitUser = async () => {
        if(account === '') {
            alert('You have not connected wallet yet.')
            return
        }

        if (borrowContract) {
            try {
                await borrowContract.methods.Init().send({from: account})
                setUpdate(1)
                alert('You have already received the cars.')
            } catch (error: any) {
                alert(error.message)
            }
        } else {
            alert('Contract not exists.')
        }
    }

    //获得当前用户拥有的车
    const GetCarList = async () => {
        if(account === '') {
            alert('You have not connected wallet yet.')
            return
        }
        if(borrowContract){
            setDisplayCarList(true);
            setDisplayUnborrowCarList(false);
        }
    }

    //获得可租借的车
    const GetBorrowList = async () => {
        if(account === '') {
            alert('You have not connected wallet yet.')
            return
        }
        if(borrowContract){
            setDisplayCarList(false);
            setDisplayUnborrowCarList(true);
        }
    }

    //当前用户借用车
    const onBorrowCar = async() => {
        if(borrowContract){
            try{
                await borrowContract.methods.BorrowCar(SelectCar,BorrowTime).send({from:account})
                setUpdate(1)
                Initialization();
                alert('You have borrowed the cars!')
            }catch (error: any) {
                alert(error.message)
            }
        }else {
            alert('Contract not exists.')
        }
    }

    //当前用户还车
    const onReturnCar = async() => {
        if(borrowContract){
            try{
                await borrowContract.methods.ReturnCar(SelectCar).send({from:account})
                setUpdate(1)
                Initialization()
                alert('You have returnen the cars!')
            }catch (error: any) {
                alert(error.message)
            }
        }else {
            alert('Contract not exists.')
        }
    }

    const onGetCarInfo = async(carId:number) => {
        setSelectCar(carId)
        if(borrowContract){
            try{
                const car_owner = await borrowContract.methods.CarOwnerof(carId).call()
                setCarOwner(car_owner)
                const CarBorrower = await borrowContract.methods.CarBorrowerof(carId).call()
                setBorrower(CarBorrower)
                const CarBorrowUnitl = await borrowContract.methods.CarBorrowerUntilof(carId).call()
                setCarBorrowUntil(CarBorrowUnitl)
            }catch(error:any){
                alert(error.message)
            }
        }else{
            alert('Contract not exists.')
        }
    }

    const Display = (props:{list:never[]}) => {
        if(props.list.length === 0)
            return(
                <div className='display'>
                    无符合要求车辆
                </div>
            )
        else
            return(
                <div className='display'>
                    {props.list.map((id)=>{
                        return(
                            <div key={id} className='display-item'>
                                <Card 
                                    hoverable 
                                    style={{ width: 240 }} 
                                    onClick={()=>onGetCarInfo(id)}
                                    cover={<img src={require(`../asset/${id}.jpg`)}/>}
                                >
                                    <Meta title={id}></Meta>
                                </Card>
                            </div>
                        )
                    })}
                </div>
            )
    }

    return (
        <div>
            <Image/>
            <div>
                <h1>汽车租借系统</h1>
                <div>
                    {account === '' && <Button onClick={onClickConnectWallet}>连接账号</Button>}
                    <div>当前用户：{account === '' ? '无用户连接' : account}</div>
                </div>
                <Button onClick={onInitUser}>领取初始车辆</Button>
                <Button onClick={GetCarList}>当前拥有车辆列表</Button>
                <Button onClick={GetBorrowList}>可租赁车辆列表</Button>
            </div>

            <div style={{display:SelectCar!=-1?'block':'none'}}>
                <div>该车Id为{SelectCar}</div>
                <div>该车Owner为{CarOwner}</div>
                <div style={{display:CarBorrower!='0x0000000000000000000000000000000000000000'?'block':'none'}}>该车Borrower为{CarBorrower}</div>
                <div style={{display:CarBorrower!='0x0000000000000000000000000000000000000000'?'block':'none'}}>
                    该车借用期限为{CarBorrowUnitl}({moment(Number(CarBorrowUnitl) * 1000).format('YYYY-MM-DD HH:mm:ss')})
                    <Button onClick={onReturnCar}>提前还车</Button>
                </div>
                <div style={{display:CarBorrower==='0x0000000000000000000000000000000000000000'&&DisplayUnborrowCarList?'block':'none'}}>
                    输入租借时间
                    <input 
                        type='number' 
                        min={1} max={360} 
                        value={BorrowTime} 
                        onChange={(e)=>setBorrowTime(e.target.valueAsNumber)}
                        />
                    <Button onClick={onBorrowCar}>租借</Button>
                </div>
            </div>

            <div style={{display:DisplayCarList?'block':'none'}}>
                <Divider plain>我的车辆</Divider>
                <Display list={CarList} />
                <Divider plain>我租借的车辆</Divider>
                <Display list={MyBorrowList} />
            </div>

            <div style={{display:DisplayUnborrowCarList?'block':'none'}}>
                <Divider plain>未借出的车辆</Divider>
                <Display list={UnBorrowList} />
            </div>

        </div>
    )
}

export default BorrowPage