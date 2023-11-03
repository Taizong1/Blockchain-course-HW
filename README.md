# 简易汽车租借系统

> 第二次作业要求（以下内容提交时可以删除）：
> 
> 简易汽车借用系统，参与方包括：汽车拥有者，有借用汽车需求的用户
>
> 背景：ERC-4907 基于 ERC-721 做了简单的优化和补充，允许用户对NFT进行租借。
> - 创建一个合约，在合约中发行NFT集合，每个NFT代表一辆汽车。给部分用户测试领取部分汽车NFT，用于后面的测试。
> - 在网站中，默认每个用户的汽车都可以被借用。每个用户可以： 
>    1. 查看自己拥有的汽车列表。查看当前还没有被借用的汽车列表。
>    2. 查询一辆汽车的主人，以及该汽车当前的借用者（如果有）。
>    3. 选择并借用某辆还没有被借用的汽车一定时间。
>    4. 上述过程中借用不需要进行付费。
> 
> - （Bonus）使用自己发行的积分（ERC20）完成付费租赁汽车的流程
> - 请大家专注于功能实现，网站UI美观程度不纳入评分标准，但要让用户能够舒适操作。简便起见，可以在网上找图片代表不同汽车，不需要将图片在链上进行存储。

## 如何运行

### 合约部分

1. 在本地启动ganache应用。

2. 在 `./contracts` 中安装需要的依赖，运行如下的命令：
    ```bash
    npm install
    ```
3. 在 `./contracts` 中编译合约，运行如下的命令：
    ```bash
    npx hardhat compile
    ```
4. 成功编译后，在`./contracts/hardhat.config.ts`文件中添加`ganache`的初始用户用于测试

5. 在 `./contracts` 中挂载合约于`ganache`上，运行如下的命令：

    ```
    npx hardhat run .\scripts\deploy.ts --network ganache
    ```

    将获得链的地址，并将其填入`./frontend/src/utils/contract-addresses.json`

6. 将 `./contracts/artifacts/contracts/BorrowYourCar.sol/BorrowYourCar.json`中的内容复制粘贴于`./frontend/src/utils/abis/Borrow.json` 中

### 前端部分

1. 在 `./frontend` 中安装需要的依赖，运行如下的命令：

    ```bash
    npm install
    ```
2. 
3. 在 `./frontend` 中启动前端程序，运行如下的命令：

    ```bash
    npm run start
    ```

## 功能实现分析

### 合约部分

#### 主要数据结构

- `struct Car`

```solidity
struct Car {
    address borrower;
    uint256 borrowUntil;
}
```

每一辆汽车的信息情况，存储借用者与借用截止时间，汽车的主人依靠`ERC721`获取

- `mapping(uint256 => Car) public cars` ：`CarToken`对汽车的映射

- `uint256 nxtToken`

本工程简化了此功能，仅用于测试合约其他功能，关于汽车NFT的发布从0开始，每次发布两辆，`nxtToken`表示下一辆被领取的车辆的`Token`。现实需求中NFT无法做到连续，因此需要其他数据结构辅助，如可以实现数据遍历的`mapping`数据结构，此工程简化了此功能

#### 领取车辆

此功能用于测试，给用户领取汽车NFT，此工程中给予用户两辆车，并无法多次领取，实现如下

```solidity
function Init() external {// 给每个用户分配两个NFT用于测试
    require(InitUser[msg.sender] == false, "BorrowYourCar: user has cars already!");
    _safeMint(msg.sender, nxtToken);
    _safeMint(msg.sender, nxtToken+1);
    nxtToken += 2;
    InitUser[msg.sender] = true;
}
```

#### 获取用户拥有的车辆信息与租借的车辆信息

遍历所有车辆，并从中找到`owner`为该用户与租期未到且`borrower`为该用户的车辆，返回其值

```solidity
function MyCarList() public view returns(uint256[] memory) {
    uint256 balance = balanceOf(msg.sender);
    uint256[] memory carList = new uint256[](balance);
    if(balance==0)return carList;
    uint256 index=0;
    for(uint256 tokenId=0;tokenId<nxtToken;tokenId++)
        if(_ownerOf(tokenId)==msg.sender){
            carList[index]=tokenId;
            index++;
            if(index==balance)break;
        }
    return carList;
}
function MyborrowedCarList() external view returns(uint256[] memory) {
    uint256[] memory carList=new uint256[](nxtToken);
    uint256 len=0;
    for (uint256 i=0;i<nxtToken;i++)
    	if(CarBorrowerof(i)==msg.sender&&CarBorrowerUntilof(i)>=block.timestamp)carList[len++]=i;
    uint256[] memory resultList=new uint256[](len);
    for(uint256 i=0;i<len;i++) 
        resultList[i]=carList[i];
    return resultList;
}
```

#### 获取未借出的车辆信息

遍历所有车辆，取出未被租借以及租期已到的车辆信息。

```solidity
function UnBorrowCarList() external view returns(uint256[] memory) {
    uint256[] memory carList=new uint256[](nxtToken);
    uint256 len=0;
    for(uint256 i=0;i<nxtToken;i++)
        if(CarBorrowerof(i)==address(0))carList[len++]=i;
        else if(CarBorrowerUntilof(i)<block.timestamp)carList[len++]=i;
    uint256[] memory resultList=new uint256[](len);
    for(uint256 i=0;i<len;i++)
        resultList[i]=carList[i];
    return resultList;
}
```

#### 借车与还车

```solidity
function BorrowCar(uint32 carTokenId , uint256 lease_time) public virtual{//租借车 输入为车的Token和租借时间(小时为单位)
    address owner=_ownerOf(carTokenId);
    require(owner != address(0), "BorrowYourCar: This token doesn't exist!");
    require(CarBorrowerof(carTokenId) == address(0), "BorrowYourCar: car has already been borrowed");
    uint256 borrowUntil=block.timestamp+lease_time*3600;
    Car storage car=cars[carTokenId];
    car.borrower=msg.sender;
    car.borrowUntil=borrowUntil;
    emit CarBorrowed(carTokenId, msg.sender, block.timestamp, borrowUntil);
}
function ReturnCar(uint256 carTokenId) public virtual{
    address owner = _ownerOf(carTokenId);
    require(owner != address(0), "BorrowYourCar: This token doesn't exist!");
    require(msg.sender == CarBorrowerof(carTokenId), "BorrowYourCar: operation caller is not borrower");
    Car storage car =  cars[carTokenId];
    car.borrower = address(0);
    car.borrowUntil = block.timestamp;
    emit CarReturn(carTokenId, msg.sender, block.timestamp);
}
```

### 前端部分

#### 链接`MetaMask`

```react
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
```

使用`useEffect`钩子实现账户变更时的数据变更，并实现用户借车、还车之后前端显示的实时变化

#### 借车还车

```react
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

```

#### 获取车辆信息

```react
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
```

## 项目运行截图

#### 初始界面

![image-20231103141624976](D:\系统默认\桌面\ZJU-blockchain-course-2023-main\frontend\image\1.png)

#### 领取车辆

在未领取过车辆的账号中，点击`领取初始车辆`

![image-20231103141653331](D:\系统默认\桌面\ZJU-blockchain-course-2023-main\frontend\image\2.png)

![image-20231103141814461](D:\系统默认\桌面\ZJU-blockchain-course-2023-main\frontend\image\3.png)

![image-20231103141835101](D:\系统默认\桌面\ZJU-blockchain-course-2023-main\frontend\image\4.png)

#### 租借车辆

点击`可租赁车辆列表`

![image-20231103141934835](D:\系统默认\桌面\ZJU-blockchain-course-2023-main\frontend\image\5.png)

点击一辆可租借车辆，可得车辆信息，输入租赁时间后点击租赁即可

![image-20231103142033185](D:\系统默认\桌面\ZJU-blockchain-course-2023-main\frontend\image\6.png)

#### 查看拥有车辆

点击`当前拥有车辆列表`，列表分为上下两部分，上部分为用户自己的车辆，下部分为租借车辆

![image-20231103142140337](D:\系统默认\桌面\ZJU-blockchain-course-2023-main\frontend\image\7.png)

#### 查看汽车信息

点击汽车图片，即可在上方得到该汽车的拥有者、租借者、借用期限，下图为刚借用的车的信息

![image-20231103142259736](D:\系统默认\桌面\ZJU-blockchain-course-2023-main\frontend\image\8.png)

#### 还车

点击`提前还车`即可将归还借用的车

![image-20231103142401729](D:\系统默认\桌面\ZJU-blockchain-course-2023-main\frontend\image\9.png)

![image-20231103142418880](D:\系统默认\桌面\ZJU-blockchain-course-2023-main\frontend\image\10.png)

## 参考内容

- 课程的参考Demo见：[DEMOs](https://github.com/LBruyne/blockchain-course-demos)。

- ERC-4907 [参考实现](https://eips.ethereum.org/EIPS/eip-4907)

