// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

// Uncomment the line to use openzeppelin/ERC721
// You can use this dependency directly because it has been installed by TA already
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
// Uncomment this line to use console.log
import "hardhat/console.sol";

contract BorrowYourCar is ERC721{

    // use a event if you want
    // to represent time you can choose block.timestamp
    event CarBorrowed(uint32 carTokenId, address borrower, uint256 startTime, uint256 duration);
    event CarReturn(uint256 carTokenId, address borrower, uint256 cancelTime);
    // maybe you need a struct to store car information
    struct Car {
        address borrower;
        uint256 borrowUntil;
    }

    mapping(uint256 => Car) public cars; // A map from car index to its information
    
    // 用户初始化 给出一定NFT 标记是否已经初始化 nxtToken为下一辆初始化的车
    uint256 private nxtToken;
    mapping(address => bool) InitUser; 
    
    constructor() ERC721("BorrowYourCar","cars"){
        nxtToken=0;
    }

    function Init() external {// 给每个用户分配两个NFT用于测试
        require(InitUser[msg.sender] == false, "BorrowYourCar: user has cars already!");
        _safeMint(msg.sender, nxtToken);
        _safeMint(msg.sender, nxtToken+1);
        nxtToken += 2;
        InitUser[msg.sender] = true;
    }

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

    function CarOwnerof(uint256 carTokenId ) public view virtual returns(address){//返回该车的拥有者
        return _ownerOf(carTokenId);
    }

    function CarBorrowerof(uint256 carTokenId) public view virtual returns(address){//返回该车的借用者
        if(uint256(cars[carTokenId].borrowUntil) >=  block.timestamp)return cars[carTokenId].borrower;
        else return address(0); //无借用记录或借用已到期
    }

    function CarBorrowerUntilof(uint256 carTokenId) public view virtual returns(uint256){//返回该车的借用者
        return cars[carTokenId].borrowUntil;
    }
}