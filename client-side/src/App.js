import {BrowserRouter  , Route, Routes, } from 'react-router-dom' ;

import LoginScreen from './pages/LoginScreen.tsx';
import Home from './pages/Home.tsx';
import Produtos from './pages/Produtos.tsx';
import Fornecedores from './pages/Fornecedores.tsx';
import Stock from './pages/Stock.tsx';
import Relatorios from './pages/Relatorios.tsx';
import AcountManager from './pages/AcountsManagener.tsx';


function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginScreen/>} />        
          <Route path="/" element={<LoginScreen />} />   
          <Route path='/home' element={<Home/>} /> 
          <Route path='/produtos' element={<Produtos/>}/> 
          <Route path='/fornecedores' element={<Fornecedores/>}/>
          <Route path='/stock' element={<Stock/>}/>
          <Route path='/relatorios' element={<Relatorios/>}/> 
          <Route path='/contas' element={<AcountManager/>}/>   
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
